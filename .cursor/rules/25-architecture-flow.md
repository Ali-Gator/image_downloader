## Extension architecture flow (MV3)

### Message/data flow
```mermaid
sequenceDiagram
  participant PopupUI
  participant ContentScript
  participant BackgroundSW
  participant ImagesPage

  PopupUI->>ContentScript: sendMessage(GRAB_IMAGES)
  ContentScript-->>PopupUI: GrabImagesResponse{images|error}
  PopupUI->>ImagesPage: chrome.tabs.create(page.html)
  PopupUI->>ImagesPage: sendImagesToTab(images)
  ImagesPage-->>PopupUI: MessageResponse.OK
  ImagesPage->>BackgroundSW: sendMessage(FETCH_IMAGE) (if needed)
  BackgroundSW-->>ImagesPage: ImageFetchResponse{dataUrl|error}
```

### Implementation anchors (where to look)
- **Popup → content script wrapper**: `src/utils/contentScriptUtils.ts` (`sendMessageToContentScript`)
- **Popup → page tab image payload**: `src/utils/messaging.ts` (`sendImagesToTab`)
- **Content script handlers**: `src/contentScript/content-script.ts`
- **Background privileged work (downloads/CORS/DNR rules)**: `src/background/index.ts`
- **Message enums and payload types**: `src/types/index.ts`


