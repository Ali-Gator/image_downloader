import React, { useState } from 'react';
import { Button, Typography, Box, Container, CircularProgress } from '@mui/material';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import * as Sentry from '@sentry/react';

export const Popup: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleGrabImages = async () => {
    setLoading(true);

    // Тестовая ошибка для Sentry
    try {
      // Создаем уникальную ошибку с меткой времени
      const timestamp = Date.now();
      const testError = new Error(`Тестовая ошибка при нажатии на кнопку Download в ${timestamp}`);
      testError.name = 'DownloadButtonTestError';
      
      // Отправляем ошибку в Sentry
      Sentry.captureException(testError, {
        tags: {
          component: 'Popup',
          action: 'grabBtn.click'
        }
      });
      
      console.error('Тестовая ошибка отправлена в Sentry');
    } catch (sentryError) {
      console.error('Ошибка при отправке в Sentry:', sentryError);
    }

    try {
      // Получаем активную вкладку
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs[0];
      
      if (activeTab?.id) {
        // Выполняем скрипт на странице для получения изображений
        const results = await chrome.scripting.executeScript({
          target: { tabId: activeTab.id, allFrames: true },
          func: () => {
            // Функция, выполняемая в контексте страницы
            const images = document.querySelectorAll('img');
            return Array.from(images).map(image => image.src);
          }
        });
        
        // Объединяем результаты из всех фреймов
        const imageUrls = results.flatMap(frame => frame.result || []);
        
        // Открываем страницу с изображениями
        await openImagesPage(imageUrls);
      } else {
        alert('Не удалось получить активную вкладку');
      }
    } catch (error) {
      console.error('Ошибка при получении изображений:', error);
      Sentry.captureException(error);
      alert('Возникла ошибка при получении изображений');
    } finally {
      setLoading(false);
    }
  };

  // Функция для открытия страницы с изображениями
  const openImagesPage = async (urls: string[]) => {
    try {
      // Создаем новую вкладку
      const tab = await chrome.tabs.create({
        url: 'page.html',
        active: false
      });
      
      // Ждем, пока страница будет готова
      setTimeout(async () => {
        if (tab.id) {
          // Отправляем сообщение со списком изображений
          chrome.tabs.sendMessage(tab.id, urls, (response) => {
            if (response === 'OK') {
              // Активируем вкладку
              chrome.tabs.update(tab.id!, { active: true });
            } else {
              alert('Произошла ошибка при открытии страницы с изображениями');
            }
          });
        }
      }, 500);
    } catch (error) {
      console.error('Ошибка при открытии страницы:', error);
      Sentry.captureException(error);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="h1" gutterBottom id="popupTitle">
          Image Downloader
        </Typography>
        
        <Button 
          variant="contained"
          color="primary"
          size="large"
          startIcon={<PhotoLibraryIcon />}
          onClick={handleGrabImages}
          disabled={loading}
          sx={{ my: 2 }}
        >
          {loading ? (
            <>
              <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
              Загрузка...
            </>
          ) : (
            'DOWNLOAD'
          )}
        </Button>
        
        <Typography variant="body2" color="textSecondary" id="helpText">
          Select images to download and click the button
        </Typography>
      </Box>
    </Container>
  );
}; 