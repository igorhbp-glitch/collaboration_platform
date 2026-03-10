// src/components/Profile/AvatarEditor.js
import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slider,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AvatarEditor from 'react-avatar-editor';

const AvatarEditorComponent = ({ open, onClose, onSave, image }) => {
  const editorRef = useRef(null);
  const [scale, setScale] = useState(1.2);
  const [position, setPosition] = useState({ x: 0.5, y: 0.5 });

  const handleScaleChange = (event, newValue) => {
    setScale(newValue);
  };

  const handlePositionChange = (newPosition) => {
    setPosition(newPosition);
  };

  const handleSave = () => {
    if (editorRef.current) {
      const canvas = editorRef.current.getImageScaledToCanvas();
      canvas.toBlob((blob) => {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        onSave(file);
      }, 'image/jpeg', 0.95);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Редактирование фото
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <AvatarEditor
            ref={editorRef}
            image={image}
            width={250}
            height={250}
            border={50}
            borderRadius={125}
            color={[0, 0, 0, 0.6]}
            scale={scale}
            position={position}
            onPositionChange={handlePositionChange}
            style={{ cursor: 'move' }}
          />

          <Box sx={{ width: '100%', px: 2 }}>
            <Typography gutterBottom>Масштаб</Typography>
            <Slider
              value={scale}
              min={1}
              max={3}
              step={0.1}
              onChange={handleScaleChange}
              aria-labelledby="scale-slider"
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button onClick={handleSave} variant="contained">
          Сохранить
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AvatarEditorComponent;