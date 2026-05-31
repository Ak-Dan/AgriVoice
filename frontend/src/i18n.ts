import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// NOTE: The four maize labels are mapped (in labels.ts) to the short keys
// rust / cercospora / blight / healthy, which keep full English + Swahili content.
// The other 34 PlantVillage labels are added below as ENGLISH-ONLY keys; under SW
// they fall back to English automatically (fallbackLng: 'en'). Descriptions and
// treatments for non-maize classes are [TODO] placeholders — fill from an
// authoritative agronomy source before relying on them.

const resources = {
  en: {
    translation: {
      appName:    'Agrivoice',
      tagline:    'AI-powered crop disease detection — maize-first, now covering 38 plant conditions',
      subtitle:   'Upload a leaf photo for instant AI diagnosis',

      heroTag:    'AI-Powered · MobileNetV2 ',
      sampleReady: 'Sample ready',

      heroStat1: '99.74% Accuracy',
      heroStat2: '38 Disease Classes',
      heroStat3: '< 3 s Response',

      nav: {
        dashboard:  'Dashboard',
        diagnose:   'Diagnose',
        home:       'Home',
        about:      'About',
        howItWorks: 'How It Works',
        contact:    'Contact',
  },

      uploadTitle:   'Upload Leaf Photo',
      uploadHint:    'Drag & drop a photo here, or tap to browse',
      uploadFormats: 'JPG · PNG · WEBP supported',
      sampleLabel:   'Or try a maize sample:',
      diagnose:      '\uD83D\uDD2C Diagnose Leaf',
      diagnosing:    'Analysing\u2026',
      uploadError:   'Please select a valid image file.',

      result:      'Diagnosis Result',
      disease:     'Detected Condition',
      confidence:  'Confidence',
      treatment:   'Recommended Treatment',
      severity:    'Severity',
      description: 'About this condition',
      tryAnother:  '\u21A9 Diagnose Another Leaf',
      prediction:  'Prediction',
      lowConfidenceNote: 'Low confidence — consider retaking the photo in better light, or consult an agronomist.',

      severityLow:    'Low',
      severityMedium: 'Medium',
      severityHigh:   'High',

      history:      'Diagnosis History',
      noHistory:    'No diagnoses yet. Upload a leaf photo to get started.',
      clearHistory: 'Clear History',

      educationalVideos: 'Educational Videos',

      healthy:     'Healthy',
      poweredBy:   'Powered by MobileNetV2',
      mmuTag:      'Multimedia University of Kenya',
      changeLang:  'Change language',
      diseaseCount:'Diagnosis',
      close:       'Close',

      diseases: {
        cercospora: 'Cercospora Leaf Spot',
        rust:       'Common Rust',
        blight:     'Northern Leaf Blight',
        healthy:    'Healthy',
        unknown:    'Unrecognised \u2014 please retake the photo',
        'Apple___Apple_scab': 'Apple — Apple Scab',
        'Apple___Black_rot': 'Apple — Black Rot',
        'Apple___Cedar_apple_rust': 'Apple — Cedar Apple Rust',
        'Apple___healthy': 'Apple — Healthy',
        'Blueberry___healthy': 'Blueberry — Healthy',
        'Cherry_(including_sour)___Powdery_mildew': 'Cherry — Powdery Mildew',
        'Cherry_(including_sour)___healthy': 'Cherry — Healthy',
        'Grape___Black_rot': 'Grape — Black Rot',
        'Grape___Esca_(Black_Measles)': 'Grape — Esca (Black Measles)',
        'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': 'Grape — Leaf Blight (Isariopsis Leaf Spot)',
        'Grape___healthy': 'Grape — Healthy',
        'Orange___Haunglongbing_(Citrus_greening)': 'Orange — Huanglongbing (Citrus Greening)',
        'Peach___Bacterial_spot': 'Peach — Bacterial Spot',
        'Peach___healthy': 'Peach — Healthy',
        'Pepper,_bell___Bacterial_spot': 'Bell Pepper — Bacterial Spot',
        'Pepper,_bell___healthy': 'Bell Pepper — Healthy',
        'Potato___Early_blight': 'Potato — Early Blight',
        'Potato___Late_blight': 'Potato — Late Blight',
        'Potato___healthy': 'Potato — Healthy',
        'Raspberry___healthy': 'Raspberry — Healthy',
        'Soybean___healthy': 'Soybean — Healthy',
        'Squash___Powdery_mildew': 'Squash — Powdery Mildew',
        'Strawberry___Leaf_scorch': 'Strawberry — Leaf Scorch',
        'Strawberry___healthy': 'Strawberry — Healthy',
        'Tomato___Bacterial_spot': 'Tomato — Bacterial Spot',
        'Tomato___Early_blight': 'Tomato — Early Blight',
        'Tomato___Late_blight': 'Tomato — Late Blight',
        'Tomato___Leaf_Mold': 'Tomato — Leaf Mold',
        'Tomato___Septoria_leaf_spot': 'Tomato — Septoria Leaf Spot',
        'Tomato___Spider_mites Two-spotted_spider_mite': 'Tomato — Two-Spotted Spider Mite',
        'Tomato___Target_Spot': 'Tomato — Target Spot',
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus': 'Tomato — Yellow Leaf Curl Virus',
        'Tomato___Tomato_mosaic_virus': 'Tomato — Mosaic Virus',
        'Tomato___healthy': 'Tomato — Healthy',
      },

      diseaseDescriptions: {
        cercospora:
          'A fungal disease causing grey-to-tan rectangular lesions on maize leaves. Spreads in warm, humid conditions with heavy dew. Can significantly reduce photosynthesis and lower yields.',
        rust:
          'Orange-brown fungal pustules on leaf surfaces that spread rapidly in warm, humid weather. Untreated infections can cause major yield loss in susceptible varieties.',
        blight:
          'Long cigar-shaped lesions with grey-green wavy margins. Thrives in cool, moist conditions. One of the most damaging maize diseases if left untreated.',
        healthy:
          'No disease detected. The leaf shows normal green tissue with no visible fungal or bacterial lesions.',
        unknown:
          'The model could not confidently match this image to a known class. Please retake the photo of a single leaf in good light.',
        'Apple___Apple_scab': '[TODO: add description for Apple — Apple Scab]',
        'Apple___Black_rot': '[TODO: add description for Apple — Black Rot]',
        'Apple___Cedar_apple_rust': '[TODO: add description for Apple — Cedar Apple Rust]',
        'Apple___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
        'Blueberry___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
        'Cherry_(including_sour)___Powdery_mildew': '[TODO: add description for Cherry — Powdery Mildew]',
        'Cherry_(including_sour)___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
        'Grape___Black_rot': '[TODO: add description for Grape — Black Rot]',
        'Grape___Esca_(Black_Measles)': '[TODO: add description for Grape — Esca (Black Measles)]',
        'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': '[TODO: add description for Grape — Leaf Blight (Isariopsis Leaf Spot)]',
        'Grape___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
        'Orange___Haunglongbing_(Citrus_greening)': '[TODO: add description for Orange — Huanglongbing (Citrus Greening)]',
        'Peach___Bacterial_spot': '[TODO: add description for Peach — Bacterial Spot]',
        'Peach___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
        'Pepper,_bell___Bacterial_spot': '[TODO: add description for Bell Pepper — Bacterial Spot]',
        'Pepper,_bell___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
        'Potato___Early_blight': '[TODO: add description for Potato — Early Blight]',
        'Potato___Late_blight': '[TODO: add description for Potato — Late Blight]',
        'Potato___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
        'Raspberry___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
        'Soybean___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
        'Squash___Powdery_mildew': '[TODO: add description for Squash — Powdery Mildew]',
        'Strawberry___Leaf_scorch': '[TODO: add description for Strawberry — Leaf Scorch]',
        'Strawberry___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
        'Tomato___Bacterial_spot': '[TODO: add description for Tomato — Bacterial Spot]',
        'Tomato___Early_blight': '[TODO: add description for Tomato — Early Blight]',
        'Tomato___Late_blight': '[TODO: add description for Tomato — Late Blight]',
        'Tomato___Leaf_Mold': '[TODO: add description for Tomato — Leaf Mold]',
        'Tomato___Septoria_leaf_spot': '[TODO: add description for Tomato — Septoria Leaf Spot]',
        'Tomato___Spider_mites Two-spotted_spider_mite': '[TODO: add description for Tomato — Two-Spotted Spider Mite]',
        'Tomato___Target_Spot': '[TODO: add description for Tomato — Target Spot]',
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus': '[TODO: add description for Tomato — Yellow Leaf Curl Virus]',
        'Tomato___Tomato_mosaic_virus': '[TODO: add description for Tomato — Mosaic Virus]',
        'Tomato___healthy': 'No disease detected. The leaf shows normal, healthy tissue.',
      },

      treatments: {
        cercospora:
          'Apply mancozeb or chlorothalonil fungicide. Remove and destroy infected leaves. Ensure adequate plant spacing to improve air circulation. Avoid overhead irrigation.',
        rust:
          'Apply triazole-based fungicides (e.g. propiconazole). Begin treatment at first sign of infection. Plant rust-resistant maize varieties in future seasons.',
        blight:
          'Apply strobilurin fungicides at early infection stage. Rotate crops with non-host plants. Remove crop debris after harvest to reduce inoculum.',
        healthy:
          'Your maize plant appears healthy. Continue regular monitoring every 7 days. Maintain soil fertility and adequate irrigation.',
        unknown:
          'No treatment suggested. Retake the photo, or consult a certified agronomist for an in-person diagnosis.',
        'Apple___Apple_scab': '[TODO: add treatment from an authoritative agronomy source for Apple — Apple Scab]',
        'Apple___Black_rot': '[TODO: add treatment from an authoritative agronomy source for Apple — Black Rot]',
        'Apple___Cedar_apple_rust': '[TODO: add treatment from an authoritative agronomy source for Apple — Cedar Apple Rust]',
        'Apple___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
        'Blueberry___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
        'Cherry_(including_sour)___Powdery_mildew': '[TODO: add treatment from an authoritative agronomy source for Cherry — Powdery Mildew]',
        'Cherry_(including_sour)___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
        'Grape___Black_rot': '[TODO: add treatment from an authoritative agronomy source for Grape — Black Rot]',
        'Grape___Esca_(Black_Measles)': '[TODO: add treatment from an authoritative agronomy source for Grape — Esca (Black Measles)]',
        'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': '[TODO: add treatment from an authoritative agronomy source for Grape — Leaf Blight (Isariopsis Leaf Spot)]',
        'Grape___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
        'Orange___Haunglongbing_(Citrus_greening)': '[TODO: add treatment from an authoritative agronomy source for Orange — Huanglongbing (Citrus Greening)]',
        'Peach___Bacterial_spot': '[TODO: add treatment from an authoritative agronomy source for Peach — Bacterial Spot]',
        'Peach___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
        'Pepper,_bell___Bacterial_spot': '[TODO: add treatment from an authoritative agronomy source for Bell Pepper — Bacterial Spot]',
        'Pepper,_bell___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
        'Potato___Early_blight': '[TODO: add treatment from an authoritative agronomy source for Potato — Early Blight]',
        'Potato___Late_blight': '[TODO: add treatment from an authoritative agronomy source for Potato — Late Blight]',
        'Potato___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
        'Raspberry___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
        'Soybean___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
        'Squash___Powdery_mildew': '[TODO: add treatment from an authoritative agronomy source for Squash — Powdery Mildew]',
        'Strawberry___Leaf_scorch': '[TODO: add treatment from an authoritative agronomy source for Strawberry — Leaf Scorch]',
        'Strawberry___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
        'Tomato___Bacterial_spot': '[TODO: add treatment from an authoritative agronomy source for Tomato — Bacterial Spot]',
        'Tomato___Early_blight': '[TODO: add treatment from an authoritative agronomy source for Tomato — Early Blight]',
        'Tomato___Late_blight': '[TODO: add treatment from an authoritative agronomy source for Tomato — Late Blight]',
        'Tomato___Leaf_Mold': '[TODO: add treatment from an authoritative agronomy source for Tomato — Leaf Mold]',
        'Tomato___Septoria_leaf_spot': '[TODO: add treatment from an authoritative agronomy source for Tomato — Septoria Leaf Spot]',
        'Tomato___Spider_mites Two-spotted_spider_mite': '[TODO: add treatment from an authoritative agronomy source for Tomato — Two-Spotted Spider Mite]',
        'Tomato___Target_Spot': '[TODO: add treatment from an authoritative agronomy source for Tomato — Target Spot]',
        'Tomato___Tomato_Yellow_Leaf_Curl_Virus': '[TODO: add treatment from an authoritative agronomy source for Tomato — Yellow Leaf Curl Virus]',
        'Tomato___Tomato_mosaic_virus': '[TODO: add treatment from an authoritative agronomy source for Tomato — Mosaic Virus]',
        'Tomato___healthy': 'Plant appears healthy. Continue regular monitoring and good crop husbandry.',
      },

      footer: {
        aboutTitle:   'About Agrivoice',
        aboutText:
          'Agrivoice is a WhatsApp/USSD-first AI agronomist for smallholder farmers. This public demo console exposes the crop diagnosis engine for Week 2 validation while the production product continues toward voice, local-language, and no-download farmer channels.',
        contactTitle: 'Contact & Support',
        linksTitle:   'Quick Links',
        tipsTitle:    'Tips for Best Results',
        hours:        'Mon \u2013 Fri, 9 AM \u2013 5 PM EAT',
        faq:          'Help Center / FAQ',
        privacy:      'Privacy Policy',
        disclaimer:
          '\u2695 This tool is for informational purposes only and does not replace advice from a certified agronomist.',
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
      appName:    'Agrivoice',
      tagline:    'Ugunduzaji wa magonjwa ya mazao kwa AI \u2014 mahindi kwanza, sasa hali 38 za mimea',
      subtitle:   'Pakia picha ya jani kwa uchunguzi wa haraka wa AI',

      heroTag:    'Inayoendeshwa na AI \u00B7 MobileNetV2 ',
      sampleReady: 'Sampuli tayari',

      heroStat1: 'Usahihi 99.74%',
      heroStat2: 'Madarasa 38 ya Magonjwa',
      heroStat3: 'Jibu < Sekunde 3',

      nav: {
        dashboard:  'Dashibodi',
        diagnose:   'Chunguza',
        home:       'Nyumbani',
        about:      'Kuhusu',
        howItWorks: 'Jinsi Inavyofanya Kazi',
        contact:    'Mawasiliano',
      },

      uploadTitle:   'Pakia Jani',
      uploadHint:    'Buruta picha hapa, au gonga kuchagua',
      uploadFormats: 'JPG \u00B7 PNG \u00B7 WEBP zinakubaliwa',
      sampleLabel:   'Au jaribu sampuli ya mahindi:',
      diagnose:      '\uD83D\uDD2C Chunguza Jani',
      diagnosing:    'Inachunguza\u2026',
      uploadError:   'Tafadhali chagua faili sahihi ya picha.',

      result:      'Matokeo ya Uchunguzi',
      disease:     'Hali Iliyogunduliwa',
      confidence:  'Uhakika',
      treatment:   'Matibabu Yanayopendekezwa',
      severity:    'Ukali',
      description: 'Kuhusu ugonjwa huu',
      tryAnother:  '\u21A9 Chunguza Jani Lingine',
      prediction:  'Utabiri',
      lowConfidenceNote: 'Uhakika mdogo \u2014 jaribu kupiga picha tena kwa mwanga bora, au wasiliana na mtaalamu wa kilimo.',

      severityLow:    'Chini',
      severityMedium: 'Wastani',
      severityHigh:   'Juu',

      history:      'Historia ya Uchunguzi',
      noHistory:    'Hakuna uchunguzi bado. Pakia picha ya jani kuanza.',
      clearHistory: 'Futa Historia',

      educationalVideos: 'Video za Elimu',

      healthy:      'Yenye Afya',
      poweredBy:    'Inaendeshwa na MobileNetV2',
      mmuTag:       'Chuo Kikuu cha Multimedia Kenya',
      changeLang:   'Badilisha lugha',
      diseaseCount: 'Uchunguzi',
      close:        'Funga',

      // Maize disease content in Swahili. Non-maize classes intentionally omitted
      // here so they fall back to English under SW (to be translated later).
      diseases: {
        cercospora: 'Madoa ya Majani (Cercospora)',
        rust:       'Kutu ya Kawaida',
        blight:     'Ugonjwa wa Majani ya Kaskazini',
        healthy:    'Yenye Afya',
        unknown:    'Haijatambuliwa \u2014 tafadhali piga picha tena',
      },

      diseaseDescriptions: {
        cercospora:
          'Ugonjwa wa kuvu unaosababisha vidonda vya mstatili vya kijivu-kahawia kwenye majani ya mahindi. Huenea katika hali ya joto na unyevu mwingi. Hupunguza usanisinuru na mavuno.',
        rust:
          'Viputo vya kuvu vya rangi ya machungwa-kahawia kwenye majani. Huenea haraka katika hali ya joto na unyevu. Inaweza kusababisha hasara kubwa ya mazao.',
        blight:
          'Vidonda virefu vya umbo la sigara na pembe za mawimbi za kijivu-kijani. Hustawi katika hali ya baridi na unyevu. Ni moja ya magonjwa mabaya zaidi ya mahindi.',
        healthy:
          'Hakuna ugonjwa uliogundulika. Jani linaonyesha tishu ya kijani ya kawaida bila vidonda vinavyoonekana.',
        unknown:
          'Mfumo haukuweza kutambua picha hii. Tafadhali piga picha ya jani moja kwa mwanga mzuri.',
      },

      treatments: {
        cercospora:
          'Tumia dawa ya ukungu kama mancozeb au chlorothalonil. Ondoa na uharibu majani yaliyoathirika. Hakikisha nafasi ya kutosha kati ya mimea kuboresha mzunguko wa hewa. Epuka umwagiliaji wa juu.',
        rust:
          'Tumia dawa za triazole (k.m. propiconazole). Anza matibabu mapema unapogundua dalili. Panda aina za mahindi zinazostahimili kutu katika misimu ijayo.',
        blight:
          'Tumia dawa za strobilurin katika hatua ya mapema ya maambukizi. Zungusha mazao na mimea isiyoathiriwa. Ondoa mabaki ya mazao baada ya mavuno kupunguza vyanzo vya maambukizi.',
        healthy:
          'Mmea wako wa mahindi unaonekana kuwa na afya. Endelea kufuatilia kila siku 7. Dumisha rutuba ya udongo na umwagiliaji wa kutosha.',
        unknown:
          'Hakuna matibabu yaliyopendekezwa. Piga picha tena, au wasiliana na mtaalamu wa kilimo.',
      },

      footer: {
        aboutTitle:   'Kuhusu Agrivoice',
        aboutText:
          'Agrivoice ni programu kamili ya kujifunza kwa mashine inayogundua magonjwa ya majani ya mazao kutoka kwa picha za simu kwa chini ya sekunde 3. Imejengwa kwa React, TypeScript, Express.js, na mfano wa MobileNetV2 uliosafirishwa hadi ONNX \u2014 imewekwa kutoka mfumo wa mafunzo hadi kiolesura cha wavuti \u2014 kuwawezesha wakulima wadogo kupata uchunguzi wa haraka na sahihi.',
        contactTitle: 'Mawasiliano na Msaada',
        linksTitle:   'Viungo vya Haraka',
        tipsTitle:    'Vidokezo vya Matokeo Bora',
        hours:        'Jumatatu \u2013 Ijumaa, 9 AM \u2013 5 PM EAT',
        faq:          'Kituo cha Msaada / Maswali',
        privacy:      'Sera ya Faragha',
        disclaimer:
          '\u2695 Chombo hiki ni kwa madhumuni ya habari tu na hakibadilishi ushauri wa mtaalamu wa kilimo.',
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
