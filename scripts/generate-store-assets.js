#!/usr/bin/env node

/**
 * Google Play Store Assets Generator
 * Generates promotional assets and prepares screenshot templates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StoreAssetsGenerator {
  constructor(outputDir = 'play-store-assets') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️ ',
      success: '✅',
      warning: '⚠️ ',
      error: '❌'
    };
    console.log(`${icons[type]} ${message}`);
  }

  generateStoreDescriptions() {
    this.log('Generating store descriptions...');

    const descriptions = {
      'short-description-en.txt': 'Gamified fitness tracker with social features, achievements, and workout analytics. Track your progress, compete with friends, and stay motivated!',
      
      'short-description-es.txt': 'Rastreador de fitness gamificado con características sociales, logros y análisis de entrenamientos. ¡Rastrea tu progreso, compite con amigos y mantente motivado!',
      
      'full-description-en.txt': `🏋️ Transform your fitness journey with Sport Tracker - the ultimate gamified fitness companion!

🎮 GAMIFICATION FEATURES
• Earn XP points for every workout completed
• Unlock achievements and level up your fitness
• Maintain workout streaks and build healthy habits
• Compete with friends on leaderboards

💪 COMPREHENSIVE TRACKING
• Extensive exercise database with detailed instructions
• Custom workout templates and routines
• Real-time workout player with timer and rest periods
• Progress analytics with charts and statistics

👥 SOCIAL FITNESS
• Connect with gym friends and workout partners
• Share your achievements and progress
• Join fitness challenges and competitions
• Motivate each other to reach fitness goals

📱 OFFLINE-FIRST DESIGN
• Works without internet connection
• Sync data when connection is available
• Progressive Web App technology
• Fast and responsive on all devices

🌟 KEY FEATURES
• Multi-language support (English & Spanish)
• Dark and light theme options
• Detailed exercise instructions with animations
• Customizable workout routines
• Progress photos and measurements tracking
• Achievement system with badges and rewards

Whether you're a beginner starting your fitness journey or an experienced athlete looking to optimize your training, Sport Tracker provides the tools and motivation you need to succeed.

Download now and start your gamified fitness adventure! 🚀`,

      'full-description-es.txt': `🏋️ ¡Transforma tu viaje fitness con Sport Tracker - el compañero de fitness gamificado definitivo!

🎮 CARACTERÍSTICAS DE GAMIFICACIÓN
• Gana puntos XP por cada entrenamiento completado
• Desbloquea logros y sube de nivel tu fitness
• Mantén rachas de entrenamiento y construye hábitos saludables
• Compite con amigos en tablas de clasificación

💪 SEGUIMIENTO INTEGRAL
• Amplia base de datos de ejercicios con instrucciones detalladas
• Plantillas de entrenamiento personalizadas y rutinas
• Reproductor de entrenamiento en tiempo real con temporizador y períodos de descanso
• Análisis de progreso con gráficos y estadísticas

👥 FITNESS SOCIAL
• Conecta con amigos del gimnasio y compañeros de entrenamiento
• Comparte tus logros y progreso
• Únete a desafíos y competiciones de fitness
• Motívense mutuamente para alcanzar objetivos de fitness

📱 DISEÑO OFFLINE-FIRST
• Funciona sin conexión a internet
• Sincroniza datos cuando la conexión esté disponible
• Tecnología de Aplicación Web Progresiva
• Rápido y responsivo en todos los dispositivos

🌟 CARACTERÍSTICAS CLAVE
• Soporte multiidioma (Inglés y Español)
• Opciones de tema oscuro y claro
• Instrucciones detalladas de ejercicios con animaciones
• Rutinas de entrenamiento personalizables
• Seguimiento de fotos de progreso y medidas
• Sistema de logros con insignias y recompensas

Ya seas un principiante comenzando tu viaje fitness o un atleta experimentado buscando optimizar tu entrenamiento, Sport Tracker proporciona las herramientas y motivación que necesitas para tener éxito.

¡Descarga ahora y comienza tu aventura fitness gamificada! 🚀`
    };

    for (const [filename, content] of Object.entries(descriptions)) {
      const filePath = path.join(this.outputDir, filename);
      fs.writeFileSync(filePath, content, 'utf8');
      this.log(`Generated ${filename}`, 'success');
    }
  }

  generateFeatureList() {
    this.log('Generating feature list...');

    const features = `• Gamified fitness tracking with XP and achievements
• Comprehensive exercise database with instructions
• Social features - connect with gym friends
• Offline-first design - works without internet
• Real-time workout player with timers
• Progress analytics and statistics
• Multi-language support (English & Spanish)
• Dark and light theme options
• Custom workout routines and templates
• Achievement system with badges
• Workout streak tracking
• Progress photos and measurements
• Leaderboards and competitions
• PWA technology - install like a native app
• Secure data sync with cloud backup
• Customizable themes and interface
• Exercise form guides and tips
• Workout history and analytics
• Social sharing and motivation
• Cross-platform compatibility`;

    const filePath = path.join(this.outputDir, 'feature-list.txt');
    fs.writeFileSync(filePath, features, 'utf8');
    this.log('Generated feature-list.txt', 'success');
  }

  generateKeywords() {
    this.log('Generating keywords...');

    const keywords = {
      'keywords-en.txt': `fitness tracker, workout app, gym tracker, exercise log, fitness gamification, workout planner, fitness social, exercise database, workout timer, fitness achievements, gym buddy, fitness motivation, workout streaks, exercise tracker, fitness analytics, workout routines, gym app, fitness progress, workout companion, fitness goals`,
      
      'keywords-es.txt': `rastreador fitness, app entrenamiento, seguidor gimnasio, registro ejercicios, gamificación fitness, planificador entrenamientos, fitness social, base datos ejercicios, temporizador entrenamiento, logros fitness, compañero gimnasio, motivación fitness, rachas entrenamiento, seguidor ejercicios, análisis fitness, rutinas entrenamiento, app gimnasio, progreso fitness, compañero entrenamiento, objetivos fitness`
    };

    for (const [filename, content] of Object.entries(keywords)) {
      const filePath = path.join(this.outputDir, filename);
      fs.writeFileSync(filePath, content, 'utf8');
      this.log(`Generated ${filename}`, 'success');
    }
  }

  generatePrivacyPolicy() {
    this.log('Generating privacy policy template...');

    const privacyPolicy = `# Privacy Policy for Sport Tracker

**Last updated:** ${new Date().toLocaleDateString()}

## Information We Collect

### Personal Information
- Profile information (name, email, profile picture) - optional
- Workout data and exercise logs
- Progress photos and measurements - optional
- Social connections and friend lists - optional

### Automatically Collected Information
- App usage analytics (anonymized)
- Device information for optimization
- Crash reports for app improvement

## How We Use Your Information

### Core Functionality
- Track your workouts and fitness progress
- Provide personalized workout recommendations
- Enable social features and friend connections
- Sync data across your devices

### App Improvement
- Analyze app usage to improve features
- Fix bugs and optimize performance
- Develop new features based on user needs

## Data Storage and Security

### Local Storage
- Most data is stored locally on your device
- Works offline without internet connection
- You control what data to sync to the cloud

### Cloud Storage (Optional)
- Encrypted data sync with Supabase
- Secure authentication and data transmission
- Regular security audits and updates

### Data Retention
- Data is kept as long as you use the app
- You can delete your account and all data anytime
- Inactive accounts may be deleted after 2 years

## Your Privacy Rights

### Access and Control
- View all your data in the app settings
- Export your data in standard formats
- Delete specific data or your entire account
- Control what information is shared socially

### Communication Preferences
- Opt out of promotional communications
- Control push notification settings
- Manage social sharing preferences

## Third-Party Services

### Supabase (Database)
- Secure cloud database for data sync
- Privacy policy: https://supabase.com/privacy
- Data processing agreement in place

### Analytics (Optional)
- Anonymized usage analytics
- No personal information shared
- Can be disabled in app settings

## Children's Privacy

This app is not intended for children under 13. We do not knowingly collect personal information from children under 13.

## International Users

Data may be processed in different countries where our service providers operate. We ensure appropriate safeguards are in place.

## Changes to This Policy

We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy in the app and updating the "Last updated" date.

## Contact Us

If you have any questions about this privacy policy or our data practices, please contact us at:

**Email:** [your-email@domain.com]
**Website:** [your-website.com]

## Data Protection Officer

For EU users, you can contact our Data Protection Officer at:
**Email:** [dpo@domain.com]

---

This privacy policy is designed to be transparent about our data practices. We are committed to protecting your privacy and giving you control over your personal information.`;

    const filePath = path.join(this.outputDir, 'privacy-policy.md');
    fs.writeFileSync(filePath, privacyPolicy, 'utf8');
    this.log('Generated privacy-policy.md', 'success');
  }

  generateScreenshotGuide() {
    this.log('Generating screenshot guide...');

    const screenshotGuide = `# Screenshot Guide for Google Play Store

## Required Screenshots

Google Play Store requires at least 2 screenshots, but 8 is recommended for better conversion.

### Phone Screenshots (Required)
- **Dimensions:** 16:9 or 9:16 aspect ratio
- **Minimum:** 320px on the shorter side
- **Maximum:** 3840px on the longer side
- **Format:** PNG or JPEG
- **Quantity:** 2-8 screenshots

### Tablet Screenshots (Optional but Recommended)
- **Dimensions:** 16:10, 16:9, or 3:2 aspect ratio
- **Same size requirements as phone
- **Quantity:** 1-8 screenshots

## Recommended Screenshots to Take

### 1. Home/Dashboard Screen
- Show the main interface with gamification elements
- Display XP, level, and current streak
- Include some workout history or progress

### 2. Workout Player
- Show the real-time workout interface
- Display exercise instructions and timer
- Include rest period or set completion

### 3. Exercise Database
- Show the comprehensive exercise library
- Display exercise details with instructions
- Include search and filter functionality

### 4. Progress Analytics
- Show charts and statistics
- Display progress over time
- Include achievement badges or milestones

### 5. Social Features
- Show friend connections and leaderboards
- Display social sharing or challenges
- Include community aspects

### 6. Gamification Elements
- Show achievement unlocking
- Display level progression
- Include streak maintenance features

### 7. Workout Planning
- Show custom workout creation
- Display workout templates
- Include routine scheduling

### 8. Profile/Settings
- Show user profile with progress
- Display customization options
- Include theme switching (dark/light)

## Screenshot Best Practices

### Content Guidelines
- Use realistic, high-quality content
- Show actual app functionality
- Avoid placeholder or lorem ipsum text
- Include diverse user scenarios

### Visual Guidelines
- Use high-resolution devices for screenshots
- Ensure good lighting and contrast
- Keep UI elements clearly visible
- Use consistent device frames (optional)

### Localization
- Take screenshots in both English and Spanish
- Ensure text is properly translated
- Consider cultural preferences in imagery

## Tools for Taking Screenshots

### Android Devices
- Use device screenshot function (Power + Volume Down)
- Android Studio emulator with high-DPI settings
- Third-party tools like Screenshot Easy

### Screenshot Enhancement
- Device frames: https://developer.android.com/distribute/marketing-tools/device-art-generator
- Image editing: Canva, Figma, or Photoshop
- Batch processing: ImageMagick or similar tools

## File Naming Convention

Use descriptive names for organization:
- \`01-home-dashboard-en.png\`
- \`02-workout-player-en.png\`
- \`03-exercise-database-en.png\`
- \`04-progress-analytics-en.png\`
- \`05-social-features-en.png\`
- \`06-gamification-en.png\`
- \`07-workout-planning-en.png\`
- \`08-profile-settings-en.png\`

Repeat with \`-es\` suffix for Spanish versions.

## Quality Checklist

Before uploading screenshots:
- [ ] All screenshots are high resolution
- [ ] Text is clearly readable
- [ ] No personal information visible
- [ ] App functionality is clearly demonstrated
- [ ] Screenshots represent current app version
- [ ] Both orientations tested (if applicable)
- [ ] Multiple device sizes tested
- [ ] Localized versions prepared

## Upload Order

Arrange screenshots in logical user flow order:
1. Home/Dashboard (first impression)
2. Core functionality (workout player)
3. Key features (exercise database, analytics)
4. Social/gamification features
5. Customization/settings

The first screenshot is most important as it appears in search results and category listings.`;

    const filePath = path.join(this.outputDir, 'screenshot-guide.md');
    fs.writeFileSync(filePath, screenshotGuide, 'utf8');
    this.log('Generated screenshot-guide.md', 'success');
  }

  generatePromotionalAssets() {
    this.log('Generating promotional asset templates...');

    const promoAssets = `# Promotional Assets for Google Play Store

## Feature Graphic (Required)
- **Dimensions:** 1024 x 500 pixels
- **Format:** PNG or JPEG
- **File size:** Max 1MB
- **Purpose:** Main promotional image shown in store

### Content Suggestions:
- App logo prominently displayed
- Key features highlighted (gamification, social, offline)
- Attractive background with fitness theme
- Clear, readable text overlay
- Call-to-action or tagline

## Hi-res Icon (Required)
- **Dimensions:** 512 x 512 pixels
- **Format:** PNG
- **File size:** Max 1MB
- **Purpose:** High-resolution version of app icon

### Requirements:
- Same design as app launcher icon
- No transparency or rounded corners
- Clear and recognizable at small sizes
- Consistent with app branding

## Promotional Video (Optional but Recommended)
- **Duration:** 30 seconds to 2 minutes
- **Format:** MP4, MOV, or AVI
- **Resolution:** 1080p recommended
- **File size:** Max 100MB

### Content Ideas:
- App walkthrough showing key features
- User testimonials or success stories
- Gamification elements in action
- Social features demonstration
- Before/after progress examples

## Additional Promotional Materials

### App Preview Images
Create variations of the feature graphic for different contexts:
- Social media sharing (1200 x 630 pixels)
- Blog post headers (1200 x 400 pixels)
- Email marketing (600 x 300 pixels)

### Press Kit Assets
- App logo in various formats (PNG, SVG, EPS)
- Screenshots in different resolutions
- App description and feature list
- Developer/company information
- Contact information for media inquiries

## Design Guidelines

### Brand Consistency
- Use consistent colors from app theme
- Include recognizable app elements
- Maintain professional appearance
- Ensure accessibility (contrast, readability)

### Messaging
- Focus on key value propositions
- Use action-oriented language
- Highlight unique features
- Include social proof if available

### Visual Elements
- High-quality graphics and images
- Consistent typography
- Appropriate use of whitespace
- Mobile-optimized design

## Tools for Creation

### Free Tools
- Canva (templates and easy editing)
- GIMP (advanced image editing)
- Figma (design and prototyping)
- Unsplash (stock photos)

### Paid Tools
- Adobe Creative Suite (Photoshop, Illustrator)
- Sketch (Mac-only design tool)
- Affinity Designer (affordable alternative)

### Online Generators
- Google Play Asset Generator
- App Store Screenshot Generator
- Device Mockup Generators

## Quality Checklist

Before finalizing promotional assets:
- [ ] All dimensions and formats correct
- [ ] File sizes within limits
- [ ] High resolution and quality
- [ ] Brand consistency maintained
- [ ] Text is readable and error-free
- [ ] Images are relevant and engaging
- [ ] No copyrighted content used
- [ ] Accessibility guidelines followed
- [ ] Multiple device previews tested
- [ ] Localized versions prepared (if needed)

## Localization Considerations

For Spanish market:
- Translate all text in promotional materials
- Consider cultural preferences in imagery
- Use appropriate Spanish terminology for fitness
- Ensure proper grammar and spelling
- Test readability with native speakers

Remember: Promotional assets are often the first impression users have of your app. Invest time in creating high-quality, engaging materials that accurately represent your app's value proposition.`;

    const filePath = path.join(this.outputDir, 'promotional-assets-guide.md');
    fs.writeFileSync(filePath, promoAssets, 'utf8');
    this.log('Generated promotional-assets-guide.md', 'success');
  }

  generateStoreListingChecklist() {
    this.log('Generating store listing checklist...');

    const checklist = `# Google Play Store Listing Checklist

## Pre-Submission Requirements

### App Build
- [ ] Final APK/AAB built and signed
- [ ] App tested on multiple devices and Android versions
- [ ] All features working correctly
- [ ] No critical bugs or crashes
- [ ] Performance optimized
- [ ] Security review completed

### Store Listing Content
- [ ] App title (max 50 characters)
- [ ] Short description (max 80 characters)
- [ ] Full description (max 4000 characters)
- [ ] App icon (512x512 PNG)
- [ ] Feature graphic (1024x500 PNG/JPEG)
- [ ] Screenshots (2-8 phone, 1-8 tablet optional)
- [ ] App category selected
- [ ] Content rating completed
- [ ] Privacy policy URL provided

### Localization
- [ ] English content complete
- [ ] Spanish content complete
- [ ] All text proofread and error-free
- [ ] Cultural appropriateness verified

## Google Play Console Setup

### Developer Account
- [ ] Google Play Developer account created ($25 one-time fee)
- [ ] Developer profile completed
- [ ] Payment profile set up (if paid app)
- [ ] Tax information provided

### App Information
- [ ] App name matches APK
- [ ] Package name matches (com.sporttracker.fitness)
- [ ] App category: Health & Fitness
- [ ] Tags and keywords optimized
- [ ] Target audience specified

### Content Rating
- [ ] Content rating questionnaire completed
- [ ] Age rating appropriate for fitness app
- [ ] Content descriptors accurate
- [ ] Rating certificates generated

### Pricing & Distribution
- [ ] App pricing set (Free recommended initially)
- [ ] Country/region distribution selected
- [ ] Device compatibility configured
- [ ] Android version requirements set

## App Content Requirements

### Functionality
- [ ] App provides substantial functionality
- [ ] Core features work without crashes
- [ ] User interface is intuitive
- [ ] Performance is acceptable
- [ ] Offline functionality works as advertised

### Content Policy Compliance
- [ ] No inappropriate content
- [ ] No misleading claims
- [ ] Accurate feature descriptions
- [ ] Proper permission usage
- [ ] No spam or repetitive content

### Technical Requirements
- [ ] Target API level 33 or higher
- [ ] 64-bit architecture support
- [ ] App bundle format (AAB) recommended
- [ ] Proper signing configuration
- [ ] Security best practices followed

## Privacy & Security

### Privacy Policy
- [ ] Privacy policy created and hosted
- [ ] URL accessible and working
- [ ] Policy covers all data collection
- [ ] Contact information included
- [ ] GDPR compliance (if applicable)

### Permissions
- [ ] Only necessary permissions requested
- [ ] Permission usage clearly explained
- [ ] Runtime permissions handled properly
- [ ] Sensitive permissions justified

### Data Safety
- [ ] Data safety section completed in Play Console
- [ ] Data collection practices disclosed
- [ ] Data sharing practices disclosed
- [ ] Security practices described

## Testing & Quality

### Device Testing
- [ ] Tested on phones (various screen sizes)
- [ ] Tested on tablets (if supported)
- [ ] Tested on different Android versions
- [ ] Tested with different system languages
- [ ] Performance tested on low-end devices

### Functionality Testing
- [ ] All features tested thoroughly
- [ ] Edge cases and error scenarios tested
- [ ] Network connectivity variations tested
- [ ] Offline functionality verified
- [ ] Data sync and backup tested

### User Experience
- [ ] App is easy to navigate
- [ ] Loading times are reasonable
- [ ] Error messages are helpful
- [ ] Accessibility features work
- [ ] Responsive design on all screen sizes

## Pre-Launch Checklist

### Final Review
- [ ] All store listing content reviewed
- [ ] Screenshots represent current app version
- [ ] App description is accurate and compelling
- [ ] Keywords optimized for discovery
- [ ] Competitive analysis completed

### Release Strategy
- [ ] Internal testing completed
- [ ] Closed testing with beta users (optional)
- [ ] Staged rollout plan prepared
- [ ] Marketing materials prepared
- [ ] Launch timeline established

### Post-Launch Preparation
- [ ] User feedback monitoring plan
- [ ] Update and maintenance schedule
- [ ] Customer support process established
- [ ] Analytics and tracking configured
- [ ] Performance monitoring set up

## Submission Process

### Upload Process
1. [ ] Sign in to Google Play Console
2. [ ] Create new app or select existing
3. [ ] Upload APK/AAB to internal testing
4. [ ] Complete store listing information
5. [ ] Set up pricing and distribution
6. [ ] Complete content rating
7. [ ] Add privacy policy URL
8. [ ] Review and submit for review

### Review Process
- [ ] App submitted for review
- [ ] Review status monitored
- [ ] Any review feedback addressed
- [ ] App approved and published
- [ ] Launch announcement prepared

## Post-Launch Tasks

### Monitoring
- [ ] Install and crash metrics monitored
- [ ] User reviews and ratings tracked
- [ ] Performance metrics analyzed
- [ ] User feedback collected and analyzed

### Optimization
- [ ] Store listing optimized based on performance
- [ ] Screenshots updated if needed
- [ ] Description refined for better conversion
- [ ] Keywords adjusted based on search data

### Updates
- [ ] Regular app updates planned
- [ ] Bug fixes prioritized
- [ ] New features based on user feedback
- [ ] Store listing kept current

## Common Rejection Reasons to Avoid

- Incomplete or misleading app descriptions
- Poor quality screenshots or graphics
- Apps that crash or don't work properly
- Inappropriate content or age rating
- Missing or inadequate privacy policy
- Excessive or unjustified permissions
- Violation of Google Play policies
- Technical issues or security vulnerabilities

## Success Metrics to Track

- App store ranking in category
- Download and install rates
- User ratings and reviews
- User retention and engagement
- Crash-free sessions percentage
- App performance metrics

Remember: The Google Play Store review process can take 1-3 days for new apps, and up to 7 days for policy reviews. Plan your launch timeline accordingly.`;

    const filePath = path.join(this.outputDir, 'store-listing-checklist.md');
    fs.writeFileSync(filePath, checklist, 'utf8');
    this.log('Generated store-listing-checklist.md', 'success');
  }

  copyAppAssets() {
    this.log('Copying app assets...');

    // Copy app icon if it exists
    const iconPath = 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png';
    if (fs.existsSync(iconPath)) {
      const destPath = path.join(this.outputDir, 'app-icon-512.png');
      fs.copyFileSync(iconPath, destPath);
      this.log('Copied app icon (512px)', 'success');
    } else {
      this.log('App icon not found at expected location', 'warning');
    }

    // Copy splash screen assets if they exist
    const splashPath = 'android/app/src/main/res/drawable/splash.png';
    if (fs.existsSync(splashPath)) {
      const destPath = path.join(this.outputDir, 'splash-screen.png');
      fs.copyFileSync(splashPath, destPath);
      this.log('Copied splash screen', 'success');
    }
  }

  generateSummaryReport() {
    this.log('Generating summary report...');

    const report = `# Play Store Assets Generation Report

**Generated:** ${new Date().toLocaleString()}
**Output Directory:** ${this.outputDir}

## Generated Files

### Store Descriptions
- ✅ short-description-en.txt
- ✅ short-description-es.txt  
- ✅ full-description-en.txt
- ✅ full-description-es.txt

### Marketing Materials
- ✅ feature-list.txt
- ✅ keywords-en.txt
- ✅ keywords-es.txt

### Legal & Compliance
- ✅ privacy-policy.md

### Guides & Documentation
- ✅ screenshot-guide.md
- ✅ promotional-assets-guide.md
- ✅ store-listing-checklist.md

### App Assets
- ${fs.existsSync(path.join(this.outputDir, 'app-icon-512.png')) ? '✅' : '❌'} app-icon-512.png
- ${fs.existsSync(path.join(this.outputDir, 'splash-screen.png')) ? '✅' : '❌'} splash-screen.png

## Next Steps

1. **Review Generated Content**
   - Proofread all descriptions for accuracy
   - Customize privacy policy with actual contact info
   - Verify feature list matches current app capabilities

2. **Create Visual Assets**
   - Take screenshots following the screenshot guide
   - Create feature graphic (1024x500px)
   - Prepare promotional video (optional)

3. **Set Up Google Play Console**
   - Create developer account if needed
   - Complete app listing with generated content
   - Upload APK/AAB and configure distribution

4. **Testing & Review**
   - Test app on multiple devices
   - Complete internal testing
   - Submit for review

## Important Notes

- All generated content is in English and Spanish
- Privacy policy template needs customization
- Screenshots must be taken manually
- Feature graphic needs to be created
- Review Google Play policies before submission

## Contact Information

Update the privacy policy and store listing with your actual contact information:
- Email: [your-email@domain.com]
- Website: [your-website.com]
- Support URL: [your-support-url.com]

---

**Generated by Sport Tracker Play Store Assets Generator**`;

    const filePath = path.join(this.outputDir, 'generation-report.md');
    fs.writeFileSync(filePath, report, 'utf8');
    this.log('Generated generation-report.md', 'success');
  }

  async run() {
    this.log('🎨 Generating Google Play Store Assets...\n');

    this.generateStoreDescriptions();
    this.generateFeatureList();
    this.generateKeywords();
    this.generatePrivacyPolicy();
    this.generateScreenshotGuide();
    this.generatePromotionalAssets();
    this.generateStoreListingChecklist();
    this.copyAppAssets();
    this.generateSummaryReport();

    this.log(`\n🎉 Store assets generated successfully!`, 'success');
    this.log(`📁 All files saved to: ${this.outputDir}`, 'info');
    this.log(`📋 Review the generation-report.md for next steps`, 'info');
  }
}

// Run generator if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const outputDir = process.argv[2] || 'play-store-assets';
  const generator = new StoreAssetsGenerator(outputDir);
  generator.run().catch(error => {
    console.error('❌ Asset generation failed:', error.message);
    process.exit(1);
  });
}

export default StoreAssetsGenerator;