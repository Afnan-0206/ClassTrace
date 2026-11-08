"""
ClassTrace Pan-Indic Multilingual Definitions & Cross-Lingual Interrogative Normalizer.
Supports 12 Major Indian College Teaching Languages:
- Hindi (hi-IN) & Hinglish
- Tamil (ta-IN) & Tanglish
- Telugu (te-IN) & Tenglish
- Kannada (kn-IN) & Kanglish
- Malayalam (ml-IN) & Manglish
- Bengali (bn-IN) & Banglish
- Marathi (mr-IN)
- Gujarati (gu-IN)
- Punjabi (pa-IN)
- Odia (or-IN)
- Indian English (en-IN)
- Auto Indic Code-Mixed (indic-auto)
"""

from typing import Dict, Set, List

SUPPORTED_LANGUAGES = [
    {"code": "indic-auto", "label": "Auto-Detect Indic Code-Mixed", "native": "सर्व भाषा (Auto)"},
    {"code": "hi-IN", "label": "Hindi / Hinglish", "native": "हिन्दी / Hinglish"},
    {"code": "en-IN", "label": "Indian English", "native": "English"},
    {"code": "ta-IN", "label": "Tamil / Tanglish", "native": "தமிழ் / Tanglish"},
    {"code": "te-IN", "label": "Telugu / Tenglish", "native": "తెలుగు / Tenglish"},
    {"code": "kn-IN", "label": "Kannada / Kanglish", "native": "ಕನ್ನಡ / Kanglish"},
    {"code": "ml-IN", "label": "Malayalam / Manglish", "native": "മലയാളം / Manglish"},
    {"code": "bn-IN", "label": "Bengali / Banglish", "native": "বাংলা / Banglish"},
    {"code": "mr-IN", "label": "Marathi", "native": "मराठी"},
    {"code": "gu-IN", "label": "Gujarati", "native": "ગુજરાતી"},
    {"code": "pa-IN", "label": "Punjabi", "native": "ਪੰਜਾਬੀ"},
    {"code": "or-IN", "label": "Odia", "native": "ଓଡ଼ିଆ"},
]

# Pan-Indic Stopwords covering both Romanized and Native scripts across all 12 languages
PAN_INDIC_STOPWORDS: Set[str] = {
    # English common stopwords
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by", "from", "up", "about",
    "into", "over", "after", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "can", "could", "should", "would", "may", "might", "must", "shall", "will",
    "this", "that", "these", "those", "it", "its", "i", "we", "you", "they", "he", "she", "sir", "teacher",
    "please", "tell", "explain", "show", "describe",

    # Hindi / Hinglish
    "ka", "ki", "ke", "ko", "se", "me", "mein", "hai", "hain", "kya", "tha", "thi", "the",
    "hota", "hoti", "hote", "jaise", "agar", "hum", "aap", "aur", "toh", "ne", "par", "pe",
    "bhi", "yeh", "woh", "unhe", "karo", "karna", "baare", "batayi", "kaise", "kab", "kyu", "kyun",
    "samjhaya", "shuru", "khatam", "bina", "bhool", "gaye",
    "का", "की", "के", "को", "से", "में", "है", "हैं", "क्या", "था", "थी", "थे", "जैसे", "अगर", "और", "तो", "ने", "पर",

    # Tamil / Tanglish
    "la", "le", "oda", "kku", "ku", "il", "irunthu", "nu", "endru", "epdi", "eppadi", "enna",
    "yen", "yethuku", "eppo", "eppothu", "enga", "engu", "yaaru", "pannaru", "sonnaru", "solli",
    "kudutharu", "illana", "illamal", "illai", "aagum", "varum", "irukku", "irukkum", "oru", "inda", "anda",
    "paathu", "pathu", "solreenga", "puriyala",
    "இல்", "கு", "உடைய", "எப்படி", "என்ன", "ஏன்", "எப்போது", "எங்கு", "யார்", "பண்ணினார்", "சொன்னார்",

    # Telugu / Tenglish
    "lo", "yokka", "ki", "ku", "nundi", "ani", "ela", "elaga", "enti", "emiti", "enduku", "eppudu",
    "ekkada", "evaru", "chesaru", "chepparu", "lekunte", "lekunda", "avtundi", "vastundi", "undi",
    "untundi", "oka", "ee", "aa", "gurinchi", "cheppandi", "ardham",
    "లో", "యొక్క", "కి", "కు", "నుండి", "ఎలా", "ఏంటి", "ఎందుకు", "ఎప్పుడు", "ఎక్కడ", "ఎవరు", "చేశారు", "చెప్పారు",

    # Kannada / Kanglish
    "nalli", "alli", "inda", "ge", "kke", "anta", "hege", "yava", "enu", "yake", "yavaga",
    "elli", "yaru", "madidru", "helidru", "illa", "andre", "agatte", "baratte", "ide", "iratte",
    "ondu", "ee", "aa", "bagge", "heli",
    "ನಲ್ಲಿ", "ಇಂದ", "ಗೆ", "ಹೇಗೆ", "ಏನು", "ಯಾಕೆ", "ಯಾವಾಗ", "ಎಲ್ಲಿ", "ಯಾರು", "ಮಾಡಿದರು", "ಹೇಳಿದರು",

    # Malayalam / Manglish
    "il", "ude", "kk", "innu", "ennu", "engane", "enthaanu", "enthu", "enthukondu", "eppol",
    "evide", "aaru", "cheythathu", "paranjathu", "illathirunnaal", "illa", "aakum", "varum",
    "undu", "aayirikkum", "oru", "ee", "aa", "kurichu",
    "இல்", "உടെ", "எங்ஙനെ", "எந்தாணு", "எந்து", "எப்போள்", "எவிടെ", "ஆரு", "செய்தது", "പറഞ്ഞത്",

    # Bengali / Banglish
    "e", "te", "er", "ke", "theke", "bole", "kivabe", "ki", "keno", "kokhon", "kothay",
    "ke", "korechilen", "bojhiechilen", "bolen", "chhara", "na", "thakle", "hobe", "hoy",
    "ache", "thakbe", "ekta", "ei", "oi", "bepare", "bolun",
    "এ", "তে", "এর", "কে", "থেকে", "কিভাবে", "কি", "কেন", "কখন", "কোথায়", "কে", "করেছিলেন", "বোঝালেন",

    # Marathi
    "madhe", "cha", "chi", "che", "na", "pasun", "mhanun", "kasa", "kashi", "kase", "kay",
    "ka", "kadhi", "kuthe", "kon", "kela", "sangitla", "samjavla", "hota", "hoti", "hote",
    "nasel", "tar", "hoil", "ahe", "ek", "ha", "hi", "he", "vishayi", "sanga",
    "मध्ये", "चा", "ची", "चे", "कसा", "कशी", "काय", "का", "कधी", "कुठे", "कोण", "केला", "सांगितला", "समजवला",

    # Gujarati
    "ma", "no", "ni", "nu", "na", "thi", "ke", "kevi", "rite", "shu", "kem", "kyare",
    "kya", "kon", "karyu", "samjavya", "hata", "hati", "hatu", "vina", "hoy", "thashe",
    "che", "ek", "aa", "vishe", "kaho",
    "માં", "નો", "ની", "નું", "કેવી", "રીતે", "શું", "કેમ", "ક્યારે", "ક્યાં", "કોણ", "સમજાવ્યા", "હતા", "છે"
}

# Cross-Lingual Question Interrogative Normalization Map
# Normalizes regional question words to canonical intent tokens
INTERROGATIVE_CANONICAL_MAP: Dict[str, str] = {
    # "HOW" / Explanation Mechanism
    "how": "how", "kaise": "how", "epdi": "how", "eppadi": "how", "ela": "how", "elaga": "how",
    "hege": "how", "engane": "how", "kivabe": "how", "kasa": "how", "kashi": "how", "kase": "how",
    "kevi": "how", "kiven": "how", "kemiti": "how",
    "कैसे": "how", "எப்படி": "how", "ఎలా": "how", "ಹೇಗೆ": "how", "എങ്ങനെ": "how", "কিভাবে": "how", "कसा": "how",

    # "WHY" / Cause & Purpose
    "why": "why", "kyu": "why", "kyun": "why", "yen": "why", "yethuku": "why", "enduku": "why",
    "yake": "why", "enthukondu": "why", "keno": "why", "ka": "why", "kem": "why", "kyon": "why",
    "काहे": "why", "ஏன்": "why", "ఎందుకు": "why", "ಯಾಕೆ": "why", "എന്തുകൊണ്ട്": "why", "কেন": "why",

    # "WHAT" / Definition & Concept
    "what": "what", "kya": "what", "enna": "what", "enti": "what", "emiti": "what", "enu": "what",
    "enthaanu": "what", "enthu": "what", "ki": "what", "kay": "what", "shu": "what", "kiya": "what",
    "क्या": "what", "என்ன": "what", "ఏంటి": "what", "ಏನು": "what", "എന്ത്": "what", "কি": "what", "काय": "what", "શું": "what",

    # "WITHOUT / MISSING / FORGET" Condition
    "without": "missing", "missing": "missing", "bina": "missing", "bhool": "missing", "forget": "missing",
    "illana": "missing", "illamal": "missing", "lekunte": "missing", "lekunda": "missing", "illa": "missing",
    "illathirunnaal": "missing", "chhara": "missing", "nasel": "missing", "vina": "missing", "na": "missing",
    "बिना": "missing", "भूल": "missing", "இல்லாமல்": "missing", "లేకుండా": "missing", "ಇಲ್ಲದೆ": "missing",

    # "CODE / SYNTAX" Intent
    "code": "code", "syntax": "code", "program": "code", "function": "code", "implement": "code",
    "likhte": "code", "kod": "code", "koduga": "code", "function-ah": "code"
}

