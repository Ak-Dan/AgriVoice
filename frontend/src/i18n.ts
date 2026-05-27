import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // ── Core app ──
      appName:    'Agrivoice',
      tagline:    'Instant AI-powered maize disease detection — from photo to treatment in seconds',
      subtitle:   'Upload a maize leaf photo for instant AI diagnosis',

      // ── Hero tag (small text above the title in the banner) ──
      heroTag:    'AI-Powered · MobileNetV2 ',

      // ── Sample chip ready state ──
      sampleReady: 'Sample ready',

      // ── Hero stats ──
      heroStat1: '95.31% Accuracy',
      heroStat2: '4 Disease Classes',
      heroStat3: '< 3 s Response',

      // ── Nav ──
      nav: {
        home:       'Home',
        about:      'About',
        howItWorks: 'How It Works',
        contact:    'Contact',
      },

      // ── Upload ──
      uploadTitle:   'Upload Maize Leaf',
      uploadHint:    'Drag & drop a photo here, or tap to browse',
      uploadFormats: 'JPG · PNG · WEBP supported',
      sampleLabel:   'Or try a sample:',
      diagnose:      '🔬 Diagnose Leaf',
      diagnosing:    'Analysing…',
      uploadError:   'Please select a valid image file.',

      // ── Result ──
      result:      'Diagnosis Result',
      disease:     'Detected Condition',
      confidence:  'Confidence',
      treatment:   'Recommended Treatment',
      severity:    'Severity',
      description: 'About this condition',
      tryAnother:  '↩ Diagnose Another Leaf',
      prediction:  'Prediction',

      // ── Severity labels ──
      severityLow:    'Low',
      severityMedium: 'Medium',
      severityHigh:   'High',

      // ── History ──
      history:      'Diagnosis History',
      noHistory:    'No diagnoses yet. Upload a leaf photo to get started.',
      clearHistory: 'Clear History',

      // ── Video ──
      educationalVideos: 'Educational Videos',

      // ── Misc ──
      healthy:     'Healthy',
      poweredBy:   'Powered by MobileNetV2',
      mmuTag:      'Multimedia University of Kenya',
      changeLang:  'Change language',
      diseaseCount:'Diagnosis',
      close:       'Close',

      // ── Disease names ──
      diseases: {
        cercospora: 'Cercospora Leaf Spot',
        rust:       'Common Rust',
        blight:     'Northern Leaf Blight',
        healthy:    'Healthy',
      },

      // ── Disease descriptions (shown in grey box on result card) ──
      diseaseDescriptions: {
        cercospora:
          'A fungal disease causing grey-to-tan rectangular lesions on maize leaves. Spreads in warm, humid conditions with heavy dew. Can significantly reduce photosynthesis and lower yields.',
        rust:
          'Orange-brown fungal pustules on leaf surfaces that spread rapidly in warm, humid weather. Untreated infections can cause major yield loss in susceptible varieties.',
        blight:
          'Long cigar-shaped lesions with grey-green wavy margins. Thrives in cool, moist conditions. One of the most damaging maize diseases if left untreated.',
        healthy:
          'No disease detected. The leaf shows normal green tissue with no visible fungal or bacterial lesions.',
      },

      // ── Treatments ──
      treatments: {
        cercospora:
          'Apply mancozeb or chlorothalonil fungicide. Remove and destroy infected leaves. Ensure adequate plant spacing to improve air circulation. Avoid overhead irrigation.',
        rust:
          'Apply triazole-based fungicides (e.g. propiconazole). Begin treatment at first sign of infection. Plant rust-resistant maize varieties in future seasons.',
        blight:
          'Apply strobilurin fungicides at early infection stage. Rotate crops with non-host plants. Remove crop debris after harvest to reduce inoculum.',
        healthy:
          'Your maize plant appears healthy. Continue regular monitoring every 7 days. Maintain soil fertility and adequate irrigation.',
      },

      // ── Footer ──
      footer: {
        aboutTitle:   'About Agrivoice',
        aboutText:
          'Agrivoice is a full-stack machine learning application that detects maize leaf diseases from smartphone photos in under 3 seconds. Built with React, TypeScript, Express.js, and a quantised MobileNetV2 model exported to ONNX — deployed end-to-end from training pipeline to mobile-responsive web interface — empowering smallholder farmers with instant, accurate diagnoses.',
        contactTitle: 'Contact & Support',
        linksTitle:   'Quick Links',
        tipsTitle:    'Tips for Best Results',
        hours:        'Mon – Fri, 9 AM – 5 PM EAT',
        faq:          'Help Center / FAQ',
        privacy:      'Privacy Policy',
        disclaimer:
          '⚕ This tool is for informational purposes only and does not replace advice from a certified agronomist.',
        tip1: 'Use a clear, well-lit photo',
        tip2: 'Ensure the full affected leaf is visible',
        tip3: 'Avoid blurry or dark images',
        tip4: 'One leaf per photo for best accuracy',
        tip5: 'If unsure, consult a certified agronomist',
      },
    },
  },

  sw: {
    translation: {
      // ── Core app ──
      appName:    'Agrivoice',
      tagline:    'Ugunduzaji wa haraka wa magonjwa ya mahindi kwa AI — kutoka picha hadi matibabu kwa sekunde',
      subtitle:   'Pakia picha ya jani la mahindi kwa uchunguzi wa haraka wa AI',

      // ── Hero tag ──
      heroTag:    'Inayoendeshwa na AI · MobileNetV2 ',

      // ── Sample chip ready state ──
      sampleReady: 'Sampuli tayari',

      // ── Hero stats ──
      heroStat1: 'Usahihi 95.31%',
      heroStat2: 'Madarasa 4 ya Magonjwa',
      heroStat3: 'Jibu < Sekunde 3',

      // ── Nav ──
      nav: {
        home:       'Nyumbani',
        about:      'Kuhusu',
        howItWorks: 'Jinsi Inavyofanya Kazi',
        contact:    'Mawasiliano',
      },

      // ── Upload ──
      uploadTitle:   'Pakia Jani la Mahindi',
      uploadHint:    'Buruta picha hapa, au gonga kuchagua',
      uploadFormats: 'JPG · PNG · WEBP zinakubaliwa',
      sampleLabel:   'Au jaribu sampuli:',
      diagnose:      '🔬 Chunguza Jani',
      diagnosing:    'Inachunguza…',
      uploadError:   'Tafadhali chagua faili sahihi ya picha.',

      // ── Result ──
      result:      'Matokeo ya Uchunguzi',
      disease:     'Hali Iliyogunduliwa',
      confidence:  'Uhakika',
      treatment:   'Matibabu Yanayopendekezwa',
      severity:    'Ukali',
      description: 'Kuhusu ugonjwa huu',
      tryAnother:  '↩ Chunguza Jani Lingine',
      prediction:  'Utabiri',

      // ── Severity labels ──
      severityLow:    'Chini',
      severityMedium: 'Wastani',
      severityHigh:   'Juu',

      // ── History ──
      history:      'Historia ya Uchunguzi',
      noHistory:    'Hakuna uchunguzi bado. Pakia picha ya jani kuanza.',
      clearHistory: 'Futa Historia',

      // ── Video ──
      educationalVideos: 'Video za Elimu',

      // ── Misc ──
      healthy:      'Yenye Afya',
      poweredBy:    'Inaendeshwa na MobileNetV2',
      mmuTag:       'Chuo Kikuu cha Multimedia Kenya',
      changeLang:   'Badilisha lugha',
      diseaseCount: 'Uchunguzi',
      close:        'Funga',

      // ── Disease names ──
      diseases: {
        cercospora: 'Madoa ya Majani (Cercospora)',
        rust:       'Kutu ya Kawaida',
        blight:     'Ugonjwa wa Majani ya Kaskazini',
        healthy:    'Yenye Afya',
      },

      // ── Disease descriptions ──
      diseaseDescriptions: {
        cercospora:
          'Ugonjwa wa kuvu unaosababisha vidonda vya mstatili vya kijivu-kahawia kwenye majani ya mahindi. Huenea katika hali ya joto na unyevu mwingi. Hupunguza usanisinuru na mavuno.',
        rust:
          'Viputo vya kuvu vya rangi ya machungwa-kahawia kwenye majani. Huenea haraka katika hali ya joto na unyevu. Inaweza kusababisha hasara kubwa ya mazao.',
        blight:
          'Vidonda virefu vya umbo la sigara na pembe za mawimbi za kijivu-kijani. Hustawi katika hali ya baridi na unyevu. Ni moja ya magonjwa mabaya zaidi ya mahindi.',
        healthy:
          'Hakuna ugonjwa uliogundulika. Jani linaonyesha tishu ya kijani ya kawaida bila vidonda vinavyoonekana.',
      },

      // ── Treatments ──
      treatments: {
        cercospora:
          'Tumia dawa ya ukungu kama mancozeb au chlorothalonil. Ondoa na uharibu majani yaliyoathirika. Hakikisha nafasi ya kutosha kati ya mimea kuboresha mzunguko wa hewa. Epuka umwagiliaji wa juu.',
        rust:
          'Tumia dawa za triazole (k.m. propiconazole). Anza matibabu mapema unapogundua dalili. Panda aina za mahindi zinazostahimili kutu katika misimu ijayo.',
        blight:
          'Tumia dawa za strobilurin katika hatua ya mapema ya maambukizi. Zungusha mazao na mimea isiyoathiriwa. Ondoa mabaki ya mazao baada ya mavuno kupunguza vyanzo vya maambukizi.',
        healthy:
          'Mmea wako wa mahindi unaonekana kuwa na afya. Endelea kufuatilia kila siku 7. Dumisha rutuba ya udongo na umwagiliaji wa kutosha.',
      },

      // ── Footer ──
      footer: {
        aboutTitle:   'Kuhusu Agrivoice',
        aboutText:
          'Agrivoice ni programu kamili ya kujifunza kwa mashine inayogundua magonjwa ya majani ya mahindi kutoka kwa picha za simu kwa chini ya sekunde 3. Imejengwa kwa React, TypeScript, Express.js, na mfano wa MobileNetV2 uliosafirishwa hadi ONNX — imewekwa kutoka mfumo wa mafunzo hadi kiolesura cha wavuti. — kuwawezesha wakulima wadogo kupata uchunguzi wa haraka na sahihi.',
        contactTitle: 'Mawasiliano na Msaada',
        linksTitle:   'Viungo vya Haraka',
        tipsTitle:    'Vidokezo vya Matokeo Bora',
        hours:        'Jumatatu – Ijumaa, 9 AM – 5 PM EAT',
        faq:          'Kituo cha Msaada / Maswali',
        privacy:      'Sera ya Faragha',
        disclaimer:
          '⚕ Chombo hiki ni kwa madhumuni ya habari tu na hakibadilishi ushauri wa mtaalamu wa kilimo.',
        tip1: 'Tumia picha iliyo wazi na yenye mwanga',
        tip2: 'Hakikisha jani lote linalathiriwa linaonekana',
        tip3: 'Epuka picha zisizo wazi au zenye giza',
        tip4: 'Jani moja kwa picha kwa usahihi zaidi',
        tip5: 'Kama una shaka, wasiliana na mtaalamu wa kilimo',
      },
    },
  },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
