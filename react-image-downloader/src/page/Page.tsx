import React, { useState, useEffect } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Grid, 
  Card, 
  CardMedia, 
  CardActions, 
  Checkbox, 
  Container, 
  CircularProgress
} from '@mui/material';
import GetAppIcon from '@mui/icons-material/GetApp';
import * as Sentry from '@sentry/react';
import JSZip from 'jszip';

interface ImageItem {
  url: string;
  filename: string;
  selected: boolean;
}

export const Page: React.FC = () => {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Подписываемся на сообщения от popup
    chrome.runtime.onMessage.addListener((urls: string[], sender, sendResponse) => {
      try {
        if (Array.isArray(urls) && urls.length > 0) {
          // Создаем массив объектов изображений
          const imageItems = urls.map(url => {
            const filename = generateFilename(url);
            return {
              url,
              filename,
              selected: true
            };
          });
          
          setImages(imageItems);
          setLoading(false);
          
          // Отправляем подтверждение получения
          sendResponse('OK');
        } else {
          console.error('Получен пустой или неверный список URL');
          Sentry.captureMessage('Получен пустой или неверный список URL', {
            level: 'warning',
            extra: { 
              urls 
            }
          });
          sendResponse('ERROR');
        }
      } catch (error) {
        console.error('Ошибка при обработке списка изображений:', error);
        Sentry.captureException(error);
        sendResponse('ERROR');
      }
      
      // Возвращаем true, чтобы указать, что ответ может быть отправлен асинхронно
      return true;
    });
  }, []);

  // Генерирует имя файла из URL
  const generateFilename = (url: string): string => {
    try {
      // Извлекаем имя файла из URL
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      
      // Если имя файла не найдено, генерируем случайное
      if (!filename || filename.trim() === '') {
        return `image_${Date.now()}.jpg`;
      }
      
      // Проверяем расширение
      const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename);
      if (!hasImageExtension) {
        return `${filename}.jpg`;
      }
      
      return filename;
    } catch (error) {
      console.error('Ошибка при генерации имени файла:', error);
      Sentry.captureException(error);
      return `image_${Date.now()}.jpg`;
    }
  };

  // Обрабатывает изменение состояния выбора изображения
  const handleToggleSelect = (index: number) => {
    setImages(prevImages => {
      const newImages = [...prevImages];
      newImages[index] = {
        ...newImages[index],
        selected: !newImages[index].selected
      };
      return newImages;
    });
  };

  // Обрабатывает выбор/отмену выбора всех изображений
  const handleToggleAll = () => {
    const allSelected = images.every(img => img.selected);
    setImages(prevImages => 
      prevImages.map(img => ({
        ...img,
        selected: !allSelected
      }))
    );
  };

  // Скачивает выбранные изображения
  const handleDownload = async () => {
    try {
      setDownloading(true);
      
      // Получаем выбранные изображения
      const selectedImages = images.filter(img => img.selected);
      
      if (selectedImages.length === 0) {
        alert('Выберите хотя бы одно изображение для скачивания');
        setDownloading(false);
        return;
      }
      
      // Если выбрано только одно изображение, скачиваем его отдельно
      if (selectedImages.length === 1) {
        const image = selectedImages[0];
        await downloadSingleImage(image.url, image.filename);
      } else {
        // Иначе создаем архив со всеми выбранными изображениями
        await downloadAsZip(selectedImages);
      }
      
      setDownloading(false);
    } catch (error) {
      console.error('Ошибка при скачивании изображений:', error);
      Sentry.captureException(error);
      alert('Ошибка при скачивании изображений');
      setDownloading(false);
    }
  };

  // Скачивает одно изображение
  const downloadSingleImage = (url: string, filename: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: false
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error('Ошибка при скачивании:', chrome.runtime.lastError);
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  };

  // Скачивает изображения как ZIP-архив
  const downloadAsZip = async (imagesToDownload: ImageItem[]): Promise<void> => {
    try {
      const zip = new JSZip();
      
      // Создаем папку для изображений
      const imgFolder = zip.folder('images');
      
      if (!imgFolder) {
        throw new Error('Не удалось создать папку для изображений');
      }
      
      // Скачиваем все изображения и добавляем в архив
      const downloadPromises = imagesToDownload.map(async (image) => {
        try {
          const response = await fetch(image.url);
          const blob = await response.blob();
          imgFolder.file(image.filename, blob);
        } catch (error) {
          console.error(`Ошибка при загрузке изображения ${image.url}:`, error);
          Sentry.captureException(error);
        }
      });
      
      // Ждем загрузки всех изображений
      await Promise.all(downloadPromises);
      
      // Создаем ZIP-архив
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Создаем URL для скачивания
      const zipUrl = URL.createObjectURL(content);
      
      // Скачиваем архив
      chrome.downloads.download({
        url: zipUrl,
        filename: `images_${Date.now()}.zip`,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error('Ошибка при скачивании архива:', chrome.runtime.lastError);
          Sentry.captureException(chrome.runtime.lastError);
        }
        
        // Освобождаем URL
        URL.revokeObjectURL(zipUrl);
      });
    } catch (error) {
      console.error('Ошибка при создании архива:', error);
      Sentry.captureException(error);
      throw error;
    }
  };

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }} id="pageTitle">
            Download Images
          </Typography>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<GetAppIcon />}
            onClick={handleDownload}
            disabled={downloading || images.length === 0}
            id="downloadAllBtn"
          >
            {downloading ? 'Скачивание...' : 'DOWNLOAD ALL'}
          </Button>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="xl" className="content" id="images-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Загрузка изображений...
            </Typography>
          </div>
        ) : images.length === 0 ? (
          <Typography variant="h5" sx={{ textAlign: 'center', mt: 4 }}>
            Изображения не найдены
          </Typography>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <Typography variant="subtitle1">
                Найдено изображений: {images.length}
              </Typography>
              <Button 
                variant="outlined" 
                onClick={handleToggleAll}
              >
                {images.every(img => img.selected) ? 'Отменить все' : 'Выбрать все'}
              </Button>
            </div>
            
            <Grid container spacing={2}>
              {images.map((image, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card>
                    <CardMedia
                      component="img"
                      height="140"
                      image={image.url}
                      alt={image.filename}
                      sx={{ objectFit: 'contain' }}
                    />
                    <CardActions sx={{ justifyContent: 'space-between' }}>
                      <Checkbox
                        checked={image.selected}
                        onChange={() => handleToggleSelect(index)}
                      />
                      <Typography variant="body2" noWrap sx={{ maxWidth: '180px' }}>
                        {image.filename}
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => downloadSingleImage(image.url, image.filename)}
                      >
                        <GetAppIcon fontSize="small" />
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>
    </>
  );
}; 