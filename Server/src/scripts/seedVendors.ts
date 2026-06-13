/**
 * seedVendors.ts
 * Seeds 150 realistic Indian vendor records.
 * Run: npx ts-node src/scripts/seedVendors.ts
 */

import sequelize from "../config/database";

const STORE_ID = 1;

const VENDORS = [
  // FMCG & Food
  { company: "Hindustan Unilever Ltd",        owner: "Rohit Joshi",       phone: "+91 98201 11001", email: "rohit.joshi@hul.in",          gst: "27AAACH2702H1ZY", address: "Andheri East, Mumbai, Maharashtra" },
  { company: "ITC Limited",                   owner: "Suresh Patel",      phone: "+91 98202 22002", email: "suresh.patel@itc.in",          gst: "19AAACI1681G1ZK", address: "Virginia House, Kolkata, West Bengal" },
  { company: "Nestlé India Pvt Ltd",          owner: "Anita Sharma",      phone: "+91 98203 33003", email: "anita.sharma@nestle.in",       gst: "06AABCN0182D1ZX", address: "DLF Cyber City, Gurugram, Haryana" },
  { company: "Britannia Industries Ltd",      owner: "Vikram Nair",       phone: "+91 98204 44004", email: "vikram.nair@britannia.in",     gst: "29AAACB3175B1Z9", address: "Cunningham Road, Bengaluru, Karnataka" },
  { company: "Dabur India Ltd",               owner: "Priya Mehta",       phone: "+91 98205 55005", email: "priya.mehta@dabur.com",        gst: "09AAACD0474G1ZV", address: "Sahibabad, Ghaziabad, Uttar Pradesh" },
  { company: "Marico Limited",                owner: "Arjun Gupta",       phone: "+91 98206 66006", email: "arjun.gupta@marico.com",       gst: "27AAACM2993P1Z4", address: "Bandra Kurla Complex, Mumbai, Maharashtra" },
  { company: "Godrej Consumer Products",      owner: "Deepa Iyer",        phone: "+91 98207 77007", email: "deepa.iyer@godrej.com",        gst: "27AABCG2449F1ZR", address: "Vikhroli, Mumbai, Maharashtra" },
  { company: "Patanjali Ayurved Ltd",         owner: "Ramesh Chandra",    phone: "+91 98208 88008", email: "ramesh.c@patanjali.in",        gst: "05AAICP4188N1ZM", address: "Haridwar, Uttarakhand" },
  { company: "Emami Limited",                 owner: "Sunita Roy",        phone: "+91 98209 99009", email: "sunita.roy@emami.com",         gst: "19AAACE8051L1ZS", address: "RSC-2, Kolkata, West Bengal" },
  { company: "Amul (GCMMF)",                  owner: "Harish Desai",      phone: "+91 98210 10010", email: "harish.desai@amul.coop",       gst: "24AAACG2907P1ZD", address: "Anand, Gujarat" },

  // Pharmaceuticals
  { company: "Sun Pharmaceutical Industries",owner: "Kavita Reddy",       phone: "+91 98211 11011", email: "kavita.reddy@sunpharma.com",   gst: "24AAICS4771F1ZB", address: "Vadodara, Gujarat" },
  { company: "Dr. Reddy's Laboratories",     owner: "Mohan Krishna",      phone: "+91 98212 22012", email: "mohan.k@drreddys.com",         gst: "36AABCD7077M1ZN", address: "Hyderabad, Telangana" },
  { company: "Cipla Ltd",                    owner: "Nalini Bose",        phone: "+91 98213 33013", email: "nalini.bose@cipla.com",        gst: "27AAACC0842F1ZJ", address: "Vikhroli, Mumbai, Maharashtra" },
  { company: "Lupin Limited",                owner: "Rajan Thakur",       phone: "+91 98214 44014", email: "rajan.thakur@lupin.com",       gst: "27AAACL3309L1ZN", address: "Worli, Mumbai, Maharashtra" },
  { company: "Aurobindo Pharma Ltd",         owner: "Meera Pillai",       phone: "+91 98215 55015", email: "meera.pillai@aurobindo.com",   gst: "36AAACA8174P1ZX", address: "Hyderabad, Telangana" },
  { company: "Zydus Lifesciences Ltd",       owner: "Anil Chauhan",       phone: "+91 98216 66016", email: "anil.chauhan@zydus.com",       gst: "24AAACZ0901N1ZE", address: "Ahmedabad, Gujarat" },
  { company: "Torrent Pharmaceuticals",      owner: "Pooja Shah",         phone: "+91 98217 77017", email: "pooja.shah@torrent.com",       gst: "24AAACT8618Q1ZI", address: "Ahmedabad, Gujarat" },
  { company: "Mankind Pharma Ltd",           owner: "Sanjay Rawat",       phone: "+91 98218 88018", email: "sanjay.rawat@mankindpharma.com",gst:"07AAACM5367P1ZB", address: "New Delhi" },
  { company: "Alkem Laboratories Ltd",       owner: "Geeta Singhania",    phone: "+91 98219 99019", email: "geeta.s@alkemlabs.com",        gst: "10AAACA8804Q1ZC", address: "Patna, Bihar" },
  { company: "Ipca Laboratories Ltd",        owner: "Vinay Kulkarni",     phone: "+91 98220 20020", email: "vinay.k@ipcalabs.com",         gst: "27AAACI3748E1ZF", address: "Kandivali, Mumbai, Maharashtra" },

  // Electronics & Technology
  { company: "Havells India Ltd",            owner: "Sudhir Verma",       phone: "+91 98221 21021", email: "sudhir.v@havells.com",         gst: "09AAACH2815F1ZA", address: "Noida, Uttar Pradesh" },
  { company: "Voltas Limited",               owner: "Anjali Tata",        phone: "+91 98222 22022", email: "anjali.tata@voltas.com",       gst: "27AAACV0512Q1ZS", address: "Churchgate, Mumbai, Maharashtra" },
  { company: "Blue Star Ltd",                owner: "Kiran Menon",        phone: "+91 98223 23023", email: "kiran.menon@bluestarindia.com",gst: "27AAACB4174B1ZF", address: "Andheri East, Mumbai, Maharashtra" },
  { company: "Whirlpool of India Ltd",       owner: "Shalini Agarwal",    phone: "+91 98224 24024", email: "shalini.a@whirlpool.com",      gst: "09AAACW1195Q1ZP", address: "Gurugram, Haryana" },
  { company: "Crompton Greaves Consumer",    owner: "Rahul Dikshit",      phone: "+91 98225 25025", email: "rahul.d@cromptongreaves.com",  gst: "27AABCC5797G1ZV", address: "Rabale, Navi Mumbai, Maharashtra" },
  { company: "Orient Electric Ltd",          owner: "Tanvi Saxena",       phone: "+91 98226 26026", email: "tanvi.s@orientelectric.in",    gst: "21AAACO0124Q1ZH", address: "Bhubaneswar, Odisha" },
  { company: "Syska LED Lights",             owner: "Pranav Mehta",       phone: "+91 98227 27027", email: "pranav.m@syska.in",            gst: "27AAFCS8427J1ZM", address: "Goregaon, Mumbai, Maharashtra" },
  { company: "Dixon Technologies",           owner: "Harsh Mittal",       phone: "+91 98228 28028", email: "harsh.m@dixontechnologies.in", gst: "09AAACD6097H1ZX", address: "Noida, Uttar Pradesh" },
  { company: "Bajaj Electricals Ltd",        owner: "Leena Bajaj",        phone: "+91 98229 29029", email: "leena.bajaj@bajajelectricals.com",gst:"27AAACB0472C1ZH",address: "Churchgate, Mumbai, Maharashtra" },
  { company: "Usha International Ltd",       owner: "Manish Kapur",       phone: "+91 98230 30030", email: "manish.kapur@usha.com",        gst: "07AAACU0399P1ZS", address: "New Delhi" },

  // Textiles & Apparel
  { company: "Raymond Ltd",                  owner: "Vivek Singhania",    phone: "+91 98231 31031", email: "vivek.s@raymond.in",           gst: "27AAACR1348L1ZO", address: "Thane, Maharashtra" },
  { company: "Arvind Limited",               owner: "Neeraj Lalbhai",     phone: "+91 98232 32032", email: "neeraj.l@arvind.com",          gst: "24AAACA5879G1ZS", address: "Ahmedabad, Gujarat" },
  { company: "Vardhman Textiles Ltd",        owner: "Kavitha Oswal",      phone: "+91 98233 33033", email: "kavitha.o@vardhman.com",       gst: "03AAACV0614L1ZK", address: "Ludhiana, Punjab" },
  { company: "Welspun India Ltd",            owner: "Balram Garg",        phone: "+91 98234 34034", email: "balram.g@welspun.com",         gst: "24AAACW3219Q1ZC", address: "Andheri East, Mumbai, Maharashtra" },
  { company: "Page Industries Ltd",          owner: "Suma Jayaram",       phone: "+91 98235 35035", email: "suma.j@pageind.com",           gst: "29AAACP7023N1ZC", address: "Bengaluru, Karnataka" },
  { company: "Trident Limited",              owner: "Shyam Aggarwal",     phone: "+91 98236 36036", email: "shyam.a@tridentindia.com",     gst: "03AAACT3614G1ZT", address: "Ludhiana, Punjab" },
  { company: "Bombay Dyeing & Mfg Co",       owner: "Wadia Ness",         phone: "+91 98237 37037", email: "ness.wadia@bombaydyeing.com",  gst: "27AAACB6219N1ZN", address: "Worli, Mumbai, Maharashtra" },
  { company: "KPR Mill Ltd",                 owner: "Palani Kumar",       phone: "+91 98238 38038", email: "palani.k@kprmills.com",        gst: "33AAACK4729B1ZS", address: "Coimbatore, Tamil Nadu" },
  { company: "Grasim Industries Ltd",        owner: "Hemant Birla",       phone: "+91 98239 39039", email: "hemant.b@grasim.com",          gst: "23AAACG2277E1ZG", address: "Aditya Birla Centre, Mumbai, Maharashtra" },
  { company: "Madura Fashion & Lifestyle",   owner: "Ashish Dikshit",     phone: "+91 98240 40040", email: "ashish.d@maduragarments.com",  gst: "29AABCM7697L1ZG", address: "Bengaluru, Karnataka" },

  // Automobiles & Auto Parts
  { company: "Bosch Ltd",                    owner: "Stefan Rao",         phone: "+91 98241 41041", email: "stefan.rao@bosch.com",         gst: "29AAACB3897P1ZN", address: "Adugodi, Bengaluru, Karnataka" },
  { company: "Motherson Sumi Systems",       owner: "Pankaj Munjal",      phone: "+91 98242 42042", email: "pankaj.m@motherson.com",       gst: "09AAACM4614L1ZI", address: "Noida, Uttar Pradesh" },
  { company: "Minda Industries Ltd",         owner: "Nirmal Minda",       phone: "+91 98243 43043", email: "nirmal.minda@minda.co.in",     gst: "06AAACM7042K1ZN", address: "Gurugram, Haryana" },
  { company: "Exide Industries Ltd",         owner: "Arun Mittal",        phone: "+91 98244 44044", email: "arun.m@exideindustries.com",   gst: "19AAACE4063L1ZM", address: "Kolkata, West Bengal" },
  { company: "Amara Raja Batteries",         owner: "Jayadev Galla",      phone: "+91 98245 45045", email: "jayadev.g@amararaja.com",      gst: "37AAACA7843C1ZL", address: "Tirupati, Andhra Pradesh" },
  { company: "Gabriel India Ltd",            owner: "Manoj Kolhatkar",    phone: "+91 98246 46046", email: "manoj.k@gabrielindia.com",     gst: "27AAACG1091G1ZE", address: "Chakan, Pune, Maharashtra" },
  { company: "Suprajit Engineering Ltd",     owner: "Ajith Kumar",        phone: "+91 98247 47047", email: "ajith.k@suprajit.com",         gst: "29AAACS2381M1ZP", address: "Bengaluru, Karnataka" },
  { company: "Bharat Forge Ltd",             owner: "Baba Kalyani",       phone: "+91 98248 48048", email: "baba.k@bharatforge.com",       gst: "27AAACB1694Q1ZR", address: "Mundhwa, Pune, Maharashtra" },
  { company: "Endurance Technologies",       owner: "Anurang Jain",       phone: "+91 98249 49049", email: "anurang.j@enduranceindia.com", gst: "27AAACE5813F1ZS", address: "Aurangabad, Maharashtra" },
  { company: "Sundaram-Clayton Ltd",         owner: "Venu Srinivasan",    phone: "+91 98250 50050", email: "venu.s@sundaram.com",          gst: "33AAACS5213G1ZN", address: "Chennai, Tamil Nadu" },

  // Building & Construction
  { company: "UltraTech Cement Ltd",         owner: "Rajiv Dalmia",       phone: "+91 98251 51051", email: "rajiv.d@ultratechcement.com",  gst: "27AAACB0572F1ZI", address: "Aditya Birla Centre, Mumbai, Maharashtra" },
  { company: "ACC Limited",                  owner: "Ameya Khopkar",      phone: "+91 98252 52052", email: "ameya.k@acclimited.com",       gst: "27AAACA1965K1ZG", address: "Churchgate, Mumbai, Maharashtra" },
  { company: "Ambuja Cements Ltd",           owner: "Neeraj Akhoury",     phone: "+91 98253 53053", email: "neeraj.a@ambujacement.com",    gst: "24AAACA7831E1ZC", address: "Ahmedabad, Gujarat" },
  { company: "Shree Cement Ltd",             owner: "HM Bangur",          phone: "+91 98254 54054", email: "hm.bangur@shreecement.com",    gst: "08AAACS6285L1ZV", address: "Beawar, Rajasthan" },
  { company: "Asian Paints Ltd",             owner: "Ashwin Dani",        phone: "+91 98255 55055", email: "ashwin.dani@asianpaints.com",  gst: "27AAACA9030C1ZO", address: "Bhandup, Mumbai, Maharashtra" },
  { company: "Berger Paints India Ltd",      owner: "Kuldip Singh",       phone: "+91 98256 56056", email: "kuldip.s@bergerpaints.com",    gst: "19AAACB0756N1ZS", address: "Kolkata, West Bengal" },
  { company: "Kansai Nerolac Paints",        owner: "Praful Thakkar",     phone: "+91 98257 57057", email: "praful.t@nerolac.com",         gst: "27AAACK1046Q1ZY", address: "Kurla, Mumbai, Maharashtra" },
  { company: "Kajaria Ceramics Ltd",         owner: "Ashok Kajaria",      phone: "+91 98258 58058", email: "ashok.kajaria@kajariatiles.com",gst:"09AAACK2048R1ZA", address: "New Delhi" },
  { company: "Somany Ceramics Ltd",          owner: "Shreekant Somany",   phone: "+91 98259 59059", email: "shreekant.s@somany.in",        gst: "09AAACS4971A1ZI", address: "Gurugram, Haryana" },
  { company: "Pidilite Industries Ltd",      owner: "Bharat Puri",        phone: "+91 98260 60060", email: "bharat.puri@pidilite.com",     gst: "27AAACP1001F1ZC", address: "Mahad, Raigad, Maharashtra" },

  // Steel & Metals
  { company: "Tata Steel Ltd",               owner: "T.V. Narendran",     phone: "+91 98261 61061", email: "tvn@tatasteel.com",            gst: "20AAACT3502B1ZX", address: "Jamshedpur, Jharkhand" },
  { company: "JSW Steel Ltd",                owner: "Sajjan Jindal",      phone: "+91 98262 62062", email: "sajjan.j@jsw.in",              gst: "29AABCJ4014B1ZU", address: "Bellary, Karnataka" },
  { company: "SAIL (Steel Authority)",       owner: "Soma Mondal",        phone: "+91 98263 63063", email: "soma.mondal@sail.in",          gst: "07AAACS4253N1ZL", address: "New Delhi" },
  { company: "Jindal Steel & Power",         owner: "Naveen Jindal",      phone: "+91 98264 64064", email: "naveen.j@jspl.com",            gst: "27AABCJ1975C1ZX", address: "New Delhi" },
  { company: "Vedanta Ltd",                  owner: "Anil Agarwal",       phone: "+91 98265 65065", email: "anil.agarwal@vedanta.co.in",   gst: "27AAACV2023N1ZF", address: "Sesa Ghor, Panaji, Goa" },
  { company: "Hindalco Industries Ltd",      owner: "Satish Pai",         phone: "+91 98266 66066", email: "satish.pai@hindalco.com",      gst: "27AAACH4673L1ZS", address: "Aditya Birla Centre, Mumbai, Maharashtra" },
  { company: "National Aluminium Co",        owner: "Sridhar Patra",      phone: "+91 98267 67067", email: "sridhar.p@nalcoindia.gov.in",  gst: "21AABCN0017F1ZX", address: "Bhubaneswar, Odisha" },
  { company: "APL Apollo Tubes Ltd",         owner: "Sanjay Gupta",       phone: "+91 98268 68068", email: "sanjay.g@aplapollo.com",       gst: "09AAACA5671F1ZT", address: "Noida, Uttar Pradesh" },
  { company: "Ratnamani Metals & Tubes",     owner: "Prakash Lath",       phone: "+91 98269 69069", email: "prakash.l@ratnamani.com",      gst: "24AAACR7491B1ZJ", address: "Ahmedabad, Gujarat" },
  { company: "Mahindra Logistics Ltd",       owner: "Rampraveen Swaminathan",phone:"+91 98270 70070",email:"rampraveen@mahindralogistics.com",gst:"27AABCM7694H1ZQ",address:"Worli, Mumbai, Maharashtra" },

  // Agri & Food Processing
  { company: "Cargill India Pvt Ltd",        owner: "Siraj Chaudhry",     phone: "+91 98271 71071", email: "siraj.c@cargill.com",          gst: "06AABCC0977A1ZM", address: "Gurugram, Haryana" },
  { company: "Adani Wilmar Ltd",             owner: "Angshu Mallick",     phone: "+91 98272 72072", email: "angshu.m@adaniwilmar.com",     gst: "24AAECF4498G1ZK", address: "Shantigram, Ahmedabad, Gujarat" },
  { company: "Ruchi Soya Industries",        owner: "Sanjeev Asthana",    phone: "+91 98273 73073", email: "sanjeev.a@ruchisoya.com",      gst: "23AAACR0064N1ZY", address: "Indore, Madhya Pradesh" },
  { company: "Bajaj Consumer Care",          owner: "Jaideep Nandi",      phone: "+91 98274 74074", email: "jaideep.n@bajajconsumercare.com",gst:"27AAACB2942K1ZO",address:"Andheri, Mumbai, Maharashtra" },
  { company: "Heritage Foods Ltd",           owner: "N Brahmani Reddy",   phone: "+91 98275 75075", email: "brahmani.r@heritagefoods.in",  gst: "36AAACH5413Q1ZI", address: "Hyderabad, Telangana" },
  { company: "Hatsun Agro Products",         owner: "RG Chandramogan",    phone: "+91 98276 76076", email: "rg.c@hatsun.com",              gst: "33AAACH1461E1ZC", address: "Chennai, Tamil Nadu" },
  { company: "Prabhat Dairy Ltd",            owner: "Sarangdhar Nirmal",  phone: "+91 98277 77077", email: "sarangdhar.n@prabhatdairy.com",gst: "27AAAFP5060D1ZS", address: "Shrirampur, Ahmednagar, Maharashtra" },
  { company: "Keventer Agro Ltd",            owner: "Mayank Jalan",       phone: "+91 98278 78078", email: "mayank.j@keventer.com",        gst: "19AABCK4016L1ZJ", address: "Kolkata, West Bengal" },
  { company: "LT Foods Ltd",                 owner: "Vijay Kumar Arora",  phone: "+91 98279 79079", email: "vijay.a@ltfoods.com",          gst: "06AAACL1699Q1ZD", address: "Gurugram, Haryana" },
  { company: "Usher Agro Ltd",               owner: "Ramesh Sahai",       phone: "+91 98280 80080", email: "ramesh.s@usheragro.com",       gst: "12AAEC3601F1ZE", address: "Muzzafarpur, Bihar" },

  // Chemicals & Plastics
  { company: "Atul Ltd",                     owner: "Sunil Lalbhai",      phone: "+91 98281 81081", email: "sunil.l@atulonline.com",       gst: "24AAACA9047M1ZW", address: "Atul, Gujarat" },
  { company: "Tata Chemicals Ltd",           owner: "R Mukundan",         phone: "+91 98282 82082", email: "r.mukundan@tatachemicals.com", gst: "24AAACT1637H1ZD", address: "Worli, Mumbai, Maharashtra" },
  { company: "SRF Limited",                  owner: "Arun Bharat Ram",    phone: "+91 98283 83083", email: "arun.br@srfl.in",              gst: "06AAACS5080G1ZY", address: "Gurugram, Haryana" },
  { company: "PI Industries Ltd",            owner: "Mayank Singhal",     phone: "+91 98284 84084", email: "mayank.s@piindustries.com",    gst: "24AAACP9016A1ZA", address: "Udaipur, Rajasthan" },
  { company: "Gharda Chemicals Ltd",         owner: "Gharda Keki",        phone: "+91 98285 85085", email: "keki@gharda.com",              gst: "27AAACG1009Q1ZI", address: "Dombivali, Thane, Maharashtra" },
  { company: "NOCIL Limited",                owner: "Chandra Shekhar",    phone: "+91 98286 86086", email: "cs@nocil.com",                 gst: "27AAACN0089L1ZG", address: "Worli, Mumbai, Maharashtra" },
  { company: "Vinati Organics Ltd",          owner: "Vinati Saraf",       phone: "+91 98287 87087", email: "vinati.saraf@vinatiorganics.com",gst:"27AAACV0762C1ZX",address: "Lote Parshuram, Ratnagiri, Maharashtra" },
  { company: "Deepak Nitrite Ltd",           owner: "Deepak Mehta",       phone: "+91 98288 88088", email: "deepak.m@deepaknitrite.com",    gst: "24AAACD5803K1ZA", address: "Vadodara, Gujarat" },
  { company: "Balaji Amines Ltd",            owner: "Gangaprasad Kedia",  phone: "+91 98289 89089", email: "gp.kedia@balajiamines.com",    gst: "27AAACB4017B1ZV", address: "Solapur, Maharashtra" },
  { company: "Navin Fluorine International",owner: "Radhesh Welling",     phone: "+91 98290 90090", email: "radhesh.w@navinfluorine.com",  gst: "24AAACN4078K1ZW", address: "Surat, Gujarat" },

  // Healthcare & Medical
  { company: "Abbott India Ltd",             owner: "Ambati Venu",        phone: "+91 98291 91091", email: "ambati.v@abbott.com",          gst: "27AAACA0013A1ZC", address: "Godrej BKC, Mumbai, Maharashtra" },
  { company: "Pfizer Ltd",                   owner: "S Sridhar",          phone: "+91 98292 92092", email: "s.sridhar@pfizer.com",         gst: "27AAACP0178P1ZU", address: "Bandra Kurla Complex, Mumbai, Maharashtra" },
  { company: "GlaxoSmithKline Pharma",       owner: "Sridhar Vedala",     phone: "+91 98293 93093", email: "sridhar.v@gsk.com",            gst: "27AAACG0063F1ZK", address: "Worli, Mumbai, Maharashtra" },
  { company: "Sanofi India Ltd",             owner: "Rajaram Narayanan",  phone: "+91 98294 94094", email: "rajaram.n@sanofi.com",         gst: "27AAACS1948M1ZH", address: "Andheri East, Mumbai, Maharashtra" },
  { company: "Fortis Healthcare Ltd",        owner: "Ranjan Sehgal",      phone: "+91 98295 95095", email: "ranjan.s@fortishealthcare.com",gst: "06AABCF0167B1ZN", address: "Gurugram, Haryana" },
  { company: "Max Healthcare Institute",     owner: "Abhay Soi",          phone: "+91 98296 96096", email: "abhay.soi@maxhealthcare.in",   gst: "07AAFCM3562L1ZN", address: "Saket, New Delhi" },
  { company: "Narayana Health Pvt Ltd",      owner: "Devi Shetty",        phone: "+91 98297 97097", email: "devi.shetty@narayanahealth.org",gst:"29AABCN0614H1ZI", address: "Bengaluru, Karnataka" },
  { company: "Indegene Pvt Ltd",             owner: "Manish Gupta",       phone: "+91 98298 98098", email: "manish.g@indegene.com",        gst: "29AABCI3012H1ZC", address: "Bengaluru, Karnataka" },
  { company: "Poly Medicure Ltd",            owner: "Himanshu Baid",      phone: "+91 98299 99099", email: "himanshu.b@polymedicure.com",  gst: "06AAACP8131C1ZM", address: "Gurugram, Haryana" },
  { company: "Trivitron Healthcare",         owner: "GSK Velu",           phone: "+91 98300 00100", email: "gsk.velu@trivitron.com",       gst: "33AABCT0248E1ZK", address: "Chennai, Tamil Nadu" },

  // Packaging & Paper
  { company: "ITC Paperboards & Specialty",  owner: "Sanjiv Puri",        phone: "+91 98301 01101", email: "sanjiv.puri@itc.in",           gst: "32AAACI1681G1ZI", address: "Tribeni, West Bengal" },
  { company: "Tamil Nadu Newsprint & Papers",owner: "Udaya Kumar",        phone: "+91 98302 02102", email: "udaya.k@tnpl.com",             gst: "33AABCT5043L1ZF", address: "Chennai, Tamil Nadu" },
  { company: "Ballarpur Industries",         owner: "Gaurav Thapar",      phone: "+91 98303 03103", email: "gaurav.t@bilt.com",            gst: "27AAACB2062E1ZL", address: "Chandrapur, Maharashtra" },
  { company: "Hindustan National Glass",     owner: "Sanjay Somany",      phone: "+91 98304 04104", email: "sanjay.s@hng.co.in",           gst: "19AAACH2073F1ZQ", address: "Rishra, West Bengal" },
  { company: "AGI Glaspac Ltd",              owner: "Arun Vasu",          phone: "+91 98305 05105", email: "arun.vasu@agiglaspac.com",     gst: "36AAACA5186L1ZM", address: "Hyderabad, Telangana" },
  { company: "UFlex Ltd",                    owner: "Ashok Chaturvedi",   phone: "+91 98306 06106", email: "ashok.c@uflexltd.com",         gst: "09AAACU1039J1ZD", address: "Noida, Uttar Pradesh" },
  { company: "Uflex Films",                  owner: "Anantshree Chaturvedi",phone:"+91 98307 07107",email:"anantshree.c@uflex.com",        gst: "09AAABI3702J1ZW", address: "Noida, Uttar Pradesh" },
  { company: "Huhtamaki India Ltd",          owner: "Ernst Nawrath",      phone: "+91 98308 08108", email: "ernst.n@huhtamaki.com",        gst: "27AAACH5318Q1ZN", address: "Thane, Maharashtra" },
  { company: "Essel Propack Ltd",            owner: "Ashok Goel",         phone: "+91 98309 09109", email: "ashok.goel@esselpropack.com",  gst: "27AAACE0877E1ZO", address: "Vasind, Thane, Maharashtra" },
  { company: "Manjushree Technopack",        owner: "Nandan Maluste",     phone: "+91 98310 10110", email: "nandan.m@manjushree.com",      gst: "29AABCM5428E1ZS", address: "Bengaluru, Karnataka" },

  // IT & Services
  { company: "Infosys BPM Ltd",             owner: "Ananta Krishnan",    phone: "+91 98311 11111", email: "ananta.k@infosys.com",         gst: "29AABCI1514K1ZR", address: "Electronic City, Bengaluru, Karnataka" },
  { company: "Wipro Infrastructure Eng",     owner: "Pratik Kumar",       phone: "+91 98312 12112", email: "pratik.k@wipro.com",           gst: "29AAACW0402G1ZT", address: "Sarjapur Road, Bengaluru, Karnataka" },
  { company: "HCL Technologies Ltd",         owner: "C Vijayakumar",      phone: "+91 98313 13113", email: "c.vjk@hcl.com",               gst: "09AAACH1799F1ZX", address: "Sector 126, Noida, Uttar Pradesh" },
  { company: "Tech Mahindra Ltd",            owner: "CP Gurnani",         phone: "+91 98314 14114", email: "cpg@techmahindra.com",         gst: "27AABCT5214F1ZO", address: "Airoli, Navi Mumbai, Maharashtra" },
  { company: "Mphasis Limited",              owner: "Nitin Rakesh",       phone: "+91 98315 15115", email: "nitin.r@mphasis.com",          gst: "29AAACM4494N1ZX", address: "Bagmane Tech Park, Bengaluru, Karnataka" },

  // Logistics & Supply Chain
  { company: "Blue Dart Express Ltd",        owner: "Balfour Manuel",     phone: "+91 98316 16116", email: "balfour.m@bluedart.com",       gst: "27AAACD4516E1ZD", address: "Sahar Airport Rd, Mumbai, Maharashtra" },
  { company: "Gati Ltd",                     owner: "Pirojshaw Sarkari",  phone: "+91 98317 17117", email: "pirojshaw.s@gati.com",         gst: "36AAACG3117H1ZL", address: "Hyderabad, Telangana" },
  { company: "VRL Logistics Ltd",            owner: "Vijay Sankeshwar",   phone: "+91 98318 18118", email: "vijay.s@vrlgroup.in",          gst: "29AABCV3148G1ZG", address: "Hubballi, Karnataka" },
  { company: "TCI Express Ltd",              owner: "Chander Agarwal",    phone: "+91 98319 19119", email: "chander.a@tciexpress.in",      gst: "09AAAET0036L1ZC", address: "Gurugram, Haryana" },
  { company: "Safexpress Pvt Ltd",           owner: "Rubal Jain",         phone: "+91 98320 20120", email: "rubal.j@safexpress.com",       gst: "06AABCS0890L1ZN", address: "Gurugram, Haryana" },

  // Retail & Distribution
  { company: "Metro Cash & Carry India",     owner: "Arvind Mediratta",   phone: "+91 98321 21121", email: "arvind.m@metro.in",            gst: "29AABCM0434F1ZW", address: "Bengaluru, Karnataka" },
  { company: "Spencer's Retail Ltd",         owner: "Devendra Chawla",    phone: "+91 98322 22122", email: "devendra.c@spencers.in",       gst: "19AACCS7671L1ZH", address: "Kolkata, West Bengal" },
  { company: "Future Enterprises Ltd",       owner: "Kishore Biyani",     phone: "+91 98323 23123", email: "kishore.b@futuregroup.in",     gst: "27AABCF0124F1ZK", address: "Lower Parel, Mumbai, Maharashtra" },
  { company: "Trent Limited",                owner: "Noel Tata",          phone: "+91 98324 24124", email: "noel.tata@trentltd.com",       gst: "27AAACT0714G1ZM", address: "Nariman Point, Mumbai, Maharashtra" },
  { company: "Shoppers Stop Ltd",            owner: "Venu Nair",          phone: "+91 98325 25125", email: "venu.nair@shoppersstop.com",   gst: "27AABCS0578L1ZG", address: "Andheri East, Mumbai, Maharashtra" },

  // Renewable Energy
  { company: "Suzlon Energy Ltd",            owner: "JP Morgan",          phone: "+91 98326 26126", email: "jp.morgan@suzlon.com",         gst: "24AAACS7620E1ZI", address: "Pune, Maharashtra" },
  { company: "Sterling and Wilson Solar",    owner: "Khurshed Daruvala",  phone: "+91 98327 27127", email: "khurshed.d@sterlingandwilson.com",gst:"27AABCS4706H1ZE",address:"Prabhadevi, Mumbai, Maharashtra" },
  { company: "Greenko Group",                owner: "Anil Chalamalasetty",phone: "+91 98328 28128", email: "anil.c@greenkogroup.com",      gst: "36AABCG7266F1ZJ", address: "Hyderabad, Telangana" },
  { company: "Adani Green Energy Ltd",       owner: "Vneet Jaain",        phone: "+91 98329 29129", email: "vneet.jaain@adani.com",        gst: "24AAECA1145E1ZW", address: "Ahmedabad, Gujarat" },
  { company: "Torrent Power Ltd",            owner: "Samir Mehta",        phone: "+91 98330 30130", email: "samir.mehta@torrentpower.com", gst: "24AAACT5456H1ZL", address: "Ahmedabad, Gujarat" },

  // Jewellery & Luxury
  { company: "Titan Company Ltd",            owner: "C K Venkataraman",   phone: "+91 98331 31131", email: "ck.v@titan.co.in",             gst: "33AAACT0381Q1ZV", address: "Hosur, Tamil Nadu" },
  { company: "Kalyan Jewellers India",       owner: "T S Kalyanaraman",   phone: "+91 98332 32132", email: "ts.k@kalyanjewellers.net",     gst: "32AABCK5285E1ZM", address: "Thrissur, Kerala" },
  { company: "Senco Gold Ltd",               owner: "Suvankar Sen",       phone: "+91 98333 33133", email: "suvankar.s@sencogold.com",     gst: "19AABCS3048B1ZY", address: "Kolkata, West Bengal" },
  { company: "PC Jeweller Ltd",              owner: "Padam Chand Gupta",  phone: "+91 98334 34134", email: "padam.g@pcjeweller.com",       gst: "07AABCP9036H1ZK", address: "New Delhi" },
  { company: "Tribhovandas Bhimji Zaveri",   owner: "Shrikant Zaveri",    phone: "+91 98335 35135", email: "shrikant.z@tbztheoriginal.in", gst: "27AAACT0571F1ZO", address: "Zaveri Bazaar, Mumbai, Maharashtra" },

  // Agriculture & Seeds
  { company: "UPL Ltd",                      owner: "Jai Shroff",         phone: "+91 98336 36136", email: "jai.shroff@upl-ltd.com",       gst: "24AAACU7521C1ZF", address: "Mumbai, Maharashtra" },
  { company: "Bayer CropScience Ltd",        owner: "Simon-Thorsten Wiebusch",phone:"+91 98337 37137",email:"simon.w@bayer.com",          gst: "27AABCB6985N1ZN", address: "Navi Mumbai, Maharashtra" },
  { company: "Dhanuka Agritech Ltd",         owner: "MK Dhanuka",         phone: "+91 98338 38138", email: "mk.dhanuka@dhanukagroup.com",  gst: "07AAACL7055H1ZX", address: "New Delhi" },
  { company: "Kaveri Seed Company",          owner: "GV Bhaskar Rao",     phone: "+91 98339 39139", email: "gv.rao@kaveri-seed.com",       gst: "36AABCK7219M1ZC", address: "Secunderabad, Telangana" },
  { company: "Rallis India Ltd",             owner: "Sanjiv Lal",         phone: "+91 98340 40140", email: "sanjiv.lal@rallis.co.in",      gst: "27AAACR3188H1ZP", address: "Worli, Mumbai, Maharashtra" },

  // Footwear
  { company: "Bata India Ltd",               owner: "Gunjan Shah",        phone: "+91 98341 41141", email: "gunjan.shah@bata.com",         gst: "19AAACB1412L1ZK", address: "Batanagar, West Bengal" },
  { company: "VKC Group",                    owner: "VKC Razak",          phone: "+91 98342 42142", email: "razak@vkcgroup.in",            gst: "32AAACV3649M1ZT", address: "Kozhikode, Kerala" },
  { company: "Liberty Shoes Ltd",            owner: "Adesh Gupta",        phone: "+91 98343 43143", email: "adesh.g@libertyshoes.com",     gst: "06AAACL0218E1ZQ", address: "Gurugram, Haryana" },
  { company: "Relaxo Footwears Ltd",         owner: "Ramesh Dua",         phone: "+91 98344 44144", email: "ramesh.dua@relaxofootwear.com",gst: "07AAACR3133Q1ZH", address: "New Delhi" },
  { company: "Khadim India Ltd",             owner: "Siddhartha Roy Burman",phone:"+91 98345 45145",email:"siddhartha.rb@khadims.com",     gst: "19AABCK4743G1ZP", address: "Kolkata, West Bengal" },

  // Miscellaneous
  { company: "Finolex Cables Ltd",           owner: "Deepak Chhabria",    phone: "+91 98346 46146", email: "deepak.c@finolex.com",         gst: "27AAACF1221D1ZA", address: "Pune, Maharashtra" },
  { company: "KEI Industries Ltd",           owner: "Anil Gupta",         phone: "+91 98347 47147", email: "anil.g@kei-ind.com",           gst: "07AAACK1313P1ZB", address: "New Delhi" },
  { company: "Polycab India Ltd",            owner: "Inder Jaisinghani",  phone: "+91 98348 48148", email: "inder.j@polycab.com",          gst: "24AAACP5643J1ZL", address: "Daman" },
  { company: "V-Guard Industries Ltd",       owner: "Mithun Chittilappilly",phone:"+91 98349 49149",email:"mithun.c@vguard.in",           gst: "32AAACV1271H1ZK", address: "Kochi, Kerala" },
  { company: "Ceat Ltd",                     owner: "Arnab Banerjee",     phone: "+91 98350 50150", email: "arnab.b@ceat.com",             gst: "27AAACR1765Q1ZU", address: "Worli, Mumbai, Maharashtra" },
];

(async () => {
  await sequelize.authenticate();

  let inserted = 0, skipped = 0;

  for (const v of VENDORS) {
    const [existing]: any[] = await sequelize.query(
      `SELECT id FROM vendors WHERE company_name = ? AND store_id = ? LIMIT 1`,
      { replacements: [v.company, STORE_ID] }
    ) as any;

    if ((existing as any[]).length > 0) { skipped++; continue; }

    await sequelize.query(
      `INSERT INTO vendors (store_id, company_name, owner_name, owner_email, owner_phone, owner_address, gst_no, status, is_deleted, created_ts, updated_ts)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())`,
      { replacements: [STORE_ID, v.company, v.owner, v.email, v.phone, v.address, v.gst] }
    );
    inserted++;
  }

  console.log(`Done. Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
  await sequelize.close();
})().catch(err => { console.error(err.message); process.exit(1); });
