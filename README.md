# 🌐 Twitch Chat Translator

A browser extension for Chrome and Brave that automatically translates Twitch chat messages to your preferred language in real-time.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

- 🌐 **Automatic Translation**: Automatically detects and translates Twitch chat messages as they appear
- 🎯 **30+ Languages**: Support for English, Spanish, French, German, Japanese, Korean, Chinese, and many more
- ⚡ **Real-time**: Translations appear instantly as new messages arrive
- 💾 **Persistent Settings**: Your language preference is saved across browser sessions
- 🔄 **Smart Caching**: Translated messages are cached for better performance
- 🎨 **Non-intrusive**: Translations appear inline with a subtle globe indicator (🌐)
- 🔧 **Easy Configuration**: Simple popup interface to select your preferred language

## 📸 Screenshots

![Extension Popup](screenshots/Screenshot%202026-01-07%20212509.png)

*Extension settings popup with language selection*

![Translation in Action](screenshots/Screenshot%202026-01-07%20215643.png)
*Twitch chat with translated messages showing the 🌐 indicator*

*Note: Add your own screenshots or update these paths to match your screenshot files*

## 🚀 Installation

### Method 1: Manual Installation (Recommended)

1. **Download the Extension**
   - Click the green "Code" button on this repository
   - Select "Download ZIP"
   - Extract the ZIP file to a folder on your computer

2. **Load Extension in Chrome/Brave**
   - Open Chrome or Brave browser
   - Navigate to:
     - Chrome: `chrome://extensions/`
     - Brave: `brave://extensions/`
   - Enable **"Developer mode"** (toggle in the top-right corner)
   - Click **"Load unpacked"**
   - Select the folder where you extracted the extension files
   - The extension should now appear in your extensions list!

3. **Verify Installation**
   - You should see the extension icon in your browser toolbar
   - Click it to open the settings popup

## 📖 Usage

1. **Open a Twitch Stream**
   - Navigate to any Twitch.tv stream with an active chat
   - Example: https://www.twitch.tv/any-streamer

2. **Configure the Extension**
   - Click the extension icon in your browser toolbar
   - Select your preferred target language from the dropdown
   - Make sure "Enable Translation" is checked
   - Click "Save Settings"

3. **Enjoy Translated Chat!**
   - Chat messages will now automatically translate to your selected language
   - Translated messages show a 🌐 indicator
   - Hover over the indicator to see the original message

## 🌍 Supported Languages

The extension supports 30+ languages including:

- **European**: English, Spanish, French, German, Italian, Portuguese, Dutch, Polish, Turkish, Swedish, Norwegian, Danish, Finnish, Czech, Hungarian, Romanian, Ukrainian, Greek
- **Asian**: Japanese, Korean, Chinese (Simplified & Traditional), Hindi, Thai, Vietnamese, Indonesian, Malay
- **Middle Eastern**: Arabic, Hebrew
- **And more!**

## 🔧 How It Works

1. **Detection**: The extension monitors the Twitch chat container for new messages using a MutationObserver
2. **Translation**: Messages are sent to Google Translate API for translation
3. **Display**: Translated text replaces the original message with a subtle indicator
4. **Caching**: Translated messages are cached to avoid redundant API calls

## 🛠️ Technical Details

- **Manifest Version**: 3 (Chrome Extension Manifest V3)
- **Translation API**: Google Translate (free endpoint)
- **Storage**: Chrome Sync Storage API
- **Content Scripts**: Injected into Twitch.tv pages
- **Browser Support**: Chrome, Brave, and other Chromium-based browsers

## 📋 Requirements

- Chrome 88+ or Brave (or any Chromium-based browser)
- Active internet connection (for translation API)
- Access to Twitch.tv

## 🐛 Troubleshooting

### Translations not appearing?
- Make sure the extension is enabled in the popup
- Refresh the Twitch page after changing settings
- Check that you're on a Twitch.tv page with an active chat
- Open browser console (F12) and look for `[Twitch Translator]` messages

### Extension icon missing?
- Make sure you loaded the extension correctly
- Check that the `icons/` folder contains icon16.png, icon48.png, and icon128.png
- Try reloading the extension in `chrome://extensions/`

### Some messages not translating?
- Very short messages (< 2 characters) are skipped
- Messages starting with `!` or `/` (commands) are skipped
- Messages already translated are cached
- Check browser console for any error messages

### Extension not working after Twitch update?
- Twitch may have changed their chat structure
- Check the browser console for errors
- You may need to update the extension if Twitch made significant changes

## 🔒 Privacy

- **No Data Collection**: The extension does not collect, store, or transmit any personal information
- **Local Processing**: All processing happens locally in your browser
- **Translation API**: Messages are sent to Google Translate API for translation only
- **Temporary Cache**: Translations are cached temporarily in browser memory (cleared when browser closes)
- **Settings Storage**: Only your language preference is stored locally using Chrome Sync Storage

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Areas for Contribution
- Additional language support
- Performance improvements
- UI/UX enhancements
- Bug fixes
- Documentation improvements

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Uses Google Translate API for translation services
- Built for the Twitch community

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Open an issue on GitHub
3. Check browser console for error messages

## 🔄 Updates

To update the extension:

1. Download the latest version from GitHub
2. Go to `chrome://extensions/` or `brave://extensions/`
3. Click the reload button on the extension
4. Or remove and re-add the extension

---

**Made with ❤️ for the Twitch community**

*Enjoy watching international streams and connecting with viewers worldwide!*

