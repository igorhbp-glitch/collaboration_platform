# backend/projects/matching.py - ПРОВЕРЕННАЯ ВЕРСИЯ
from users.models import CustomUser
from django.db.models import Q
from django.core.cache import cache
import time
import hashlib
import random

WEIGHTS = {
    'research_fields': 0.35,
    'competencies': 0.30,
    'methodologies': 0.20,
    'publications': 0.10,
    'branch': 0.05,
}

BONUS = {
    'same_branch': 0.15,
    'complementary_skills': 0.10,
    'high_publications': 0.08,
}


def normalize_score(score, min_val=0.0, max_val=1.0):
    return max(min_val, min(max_val, score))


def calculate_similarity(set1, set2):
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0


def calculate_weighted_similarity(items1, items2, weight_factor=1.0):
    if not items1 or not items2:
        return 0.0
    set1 = set(items1)
    set2 = set(items2)
    jaccard = calculate_similarity(set1, set2)
    common = len(set1.intersection(set2))
    bonus = min(common * 0.05, 0.2)
    return normalize_score(jaccard + bonus * weight_factor)


def calculate_publication_score(pubs1, pubs2):
    if pubs1 == 0 and pubs2 == 0:
        return 0.5
    if pubs1 == 0 or pubs2 == 0:
        return 0.3
    ratio = min(pubs1, pubs2) / max(pubs1, pubs2)
    return normalize_score(ratio)


def calculate_complementary_score(comp1, comp2):
    if not comp1 or not comp2:
        return 0.0
    set1 = set(comp1)
    set2 = set(comp2)
    unique_to_1 = set1 - set2
    unique_to_2 = set2 - set1
    total_unique = len(unique_to_1) + len(unique_to_2)
    total_skills = len(set1) + len(set2)
    if total_skills == 0:
        return 0.0
    return normalize_score(total_unique / total_skills)


def get_user_features(user):
    return {
        'research_fields': set(user.research_fields.values_list('id', flat=True)),
        'competencies': set(user.competencies.values_list('id', flat=True)),
        'methodologies': set(user.methodologies.values_list('id', flat=True)),
        'publications_count': user.publications_count or 0,
        'branch_id': user.branch_id,
    }


def find_recommendations(current_user, limit=20):
    print(f"\n=== РАСШИРЕННЫЙ АЛГОРИТМ РЕКОМЕНДАЦИЙ ДЛЯ {current_user.username} ===")
    start_time = time.time()

    cache_key = f"user_recommendations_v2_{current_user.id}"
    cached = cache.get(cache_key)
    if cached:
        print(f"✅ Используем кэш ({len(cached)} рекомендаций)")
        return cached

    current_features = get_user_features(current_user)

    candidates = CustomUser.objects.exclude(
        Q(id=current_user.id) |
        Q(role__in=['admin', 'administrator'])
    ).filter(is_active=True)

    print(f"🔍 Анализируем {candidates.count()} кандидатов")

    recommendations = []

    for user in candidates.iterator():
        features = get_user_features(user)

        research_sim = calculate_weighted_similarity(
            current_features['research_fields'],
            features['research_fields']
        )

        competency_sim = calculate_weighted_similarity(
            current_features['competencies'],
            features['competencies']
        )

        methodology_sim = calculate_weighted_similarity(
            current_features['methodologies'],
            features['methodologies']
        )

        pub_score = calculate_publication_score(
            current_features['publications_count'],
            features['publications_count']
        )

        comp_score = calculate_complementary_score(
            list(current_features['competencies']),
            list(features['competencies'])
        )

        total = (
                research_sim * WEIGHTS['research_fields'] +
                competency_sim * WEIGHTS['competencies'] +
                methodology_sim * WEIGHTS['methodologies'] +
                pub_score * WEIGHTS['publications']
        )

        bonus = 0.0
        if current_features['branch_id'] and current_features['branch_id'] == features['branch_id']:
            bonus += BONUS['same_branch']
        if comp_score > 0.3:
            bonus += BONUS['complementary_skills'] * comp_score
        if user.publications_count and user.publications_count > 5:
            bonus += BONUS['high_publications']

        total = normalize_score(total + bonus)

        if total < 0.3:
            continue

        common_research = list(
            user.research_fields.filter(
                id__in=current_features['research_fields']
            ).values_list('name', flat=True)[:3]
        )

        common_comp = list(
            user.competencies.filter(
                id__in=current_features['competencies']
            ).values_list('name', flat=True)[:3]
        )

        if total >= 0.8:
            comp_type = "Идеальный партнер 🏆"
        elif total >= 0.7:
            comp_type = "Отличная совместимость ⭐"
        elif total >= 0.6:
            comp_type = "Хорошая совместимость 👍"
        elif total >= 0.5:
            comp_type = "Перспективный коллега 🔍"
        else:
            comp_type = "Потенциальный интерес 💡"

        recommendations.append({
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.full_name,
            'role': user.role,
            'branch': user.branch.name if user.branch else None,
            'position': user.get_position_display() if user.position else None,
            'avatar': user.avatar.url if user.avatar else None,
            'match_score': round(total, 2),
            'match_percentage': int(total * 100),
            'compatibility_type': comp_type,
            'common_research': common_research,
            'common_competencies': common_comp,
            'research_fields': list(user.research_fields.values_list('name', flat=True)[:5]),
            'competencies': list(user.competencies.values_list('name', flat=True)[:8]),
            'publications_count': user.publications_count or 0,
        })

    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    final = recommendations[:limit]

    print(f"\n📊 Найдено: {len(final)} рекомендаций")
    print(f"⏱️ Время: {(time.time() - start_time) * 1000:.2f} мс")

    cache.set(cache_key, final, 300)
    return final


def clear_recommendations_cache(user_id=None):
    if user_id:
        cache.delete(f"user_recommendations_v2_{user_id}")
        print(f"🧹 Кэш для пользователя {user_id} очищен")