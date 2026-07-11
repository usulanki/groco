/**
 * seedLocations.ts — Seeds all Indian states/UTs and their major cities.
 * Run: npx tsx src/seeders/seedLocations.ts
 * Safe to re-run: uses ignoreDuplicates, so existing rows are untouched.
 */

import sequelize from "../config/database";
import "../models/index";
import State from "../models/state.model";
import City from "../models/city.model";

interface LocationData {
  state: string;
  cities: string[];
}

const INDIA: LocationData[] = [
  {
    state: "Andhra Pradesh",
    cities: [
      "Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Kurnool",
      "Nellore", "Rajahmundry", "Kakinada", "Kadapa", "Anantapur",
      "Ongole", "Eluru", "Machilipatnam", "Vizianagaram", "Chittoor",
      "Srikakulam", "Hindupur", "Tenali", "Bhimavaram", "Narasaraopet",
    ],
  },
  {
    state: "Arunachal Pradesh",
    cities: [
      "Itanagar", "Naharlagun", "Tawang", "Pasighat", "Ziro",
      "Along", "Bomdila", "Tezu", "Khonsa", "Namsai",
    ],
  },
  {
    state: "Assam",
    cities: [
      "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon",
      "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Lakhimpur",
      "Karimganj", "Sivasagar", "Goalpara", "Barpeta", "Haflong",
      "Diphu", "Nalbari", "Golaghat", "Kokrajhar", "Hailakandi",
    ],
  },
  {
    state: "Bihar",
    cities: [
      "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia",
      "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar",
      "Munger", "Chhapra", "Hajipur", "Sasaram", "Siwan",
      "Motihari", "Bettiah", "Madhubani", "Saharsa", "Supaul",
      "Aurangabad", "Nawada", "Jehanabad", "Buxar", "Kishanganj",
    ],
  },
  {
    state: "Chhattisgarh",
    cities: [
      "Raipur", "Bhilai", "Bilaspur", "Korba", "Durg",
      "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari",
      "Mahasamund", "Kanker", "Kondagaon", "Bemetara", "Kawardha",
      "Balod", "Mungeli", "Gariaband", "Surajpur", "Balrampur",
    ],
  },
  {
    state: "Goa",
    cities: [
      "Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda",
      "Bicholim", "Curchorem", "Canacona", "Calangute", "Pernem",
    ],
  },
  {
    state: "Gujarat",
    cities: [
      "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar",
      "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Nadiad",
      "Morbi", "Mehsana", "Bharuch", "Surendranagar", "Amreli",
      "Valsad", "Navsari", "Porbandar", "Godhra", "Dahod",
      "Palanpur", "Botad", "Veraval", "Gondal", "Dwarka",
      "Gandhidham", "Kutch", "Patan", "Himatnagar", "Modasa",
    ],
  },
  {
    state: "Haryana",
    cities: [
      "Faridabad", "Gurugram", "Panipat", "Ambala", "Yamunanagar",
      "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula",
      "Bhiwani", "Sirsa", "Bahadurgarh", "Jind", "Thanesar",
      "Kaithal", "Palwal", "Rewari", "Hansi", "Narnaul",
      "Fatehabad", "Gohana", "Tohana", "Nuh", "Pehowa",
    ],
  },
  {
    state: "Himachal Pradesh",
    cities: [
      "Shimla", "Dharamshala", "Solan", "Mandi", "Baddi",
      "Palampur", "Kullu", "Manali", "Bilaspur", "Hamirpur",
      "Una", "Chamba", "Nahan", "Kangra", "Nurpur",
      "Sundernagar", "Parwanoo", "Nalagarh", "Rampur", "Sirmaur",
    ],
  },
  {
    state: "Jharkhand",
    cities: [
      "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Hazaribagh",
      "Deoghar", "Giridih", "Ramgarh", "Phusro", "Medininagar",
      "Chirkunda", "Chaibasa", "Dumka", "Gumla", "Lohardaga",
      "Simdega", "Pakur", "Sahebganj", "Godda", "Koderma",
    ],
  },
  {
    state: "Karnataka",
    cities: [
      "Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi",
      "Kalaburagi", "Ballari", "Tumakuru", "Shivamogga", "Davanagere",
      "Bidar", "Vijayapura", "Raichur", "Hassan", "Udupi",
      "Dharwad", "Chitradurga", "Kolar", "Mandya", "Chikkamagaluru",
      "Gadag", "Yadgir", "Haveri", "Koppal", "Chikkaballapur",
      "Bagalkot", "Chamarajanagar", "Kodagu", "Shimoga", "Robertsonpet",
    ],
  },
  {
    state: "Kerala",
    cities: [
      "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam",
      "Palakkad", "Alappuzha", "Kannur", "Kasaragod", "Malappuram",
      "Kottayam", "Idukki", "Wayanad", "Pathanamthitta", "Ernakulam",
      "Aluva", "Tirur", "Vatakara", "Thalassery", "Guruvayur",
      "Irinjalakuda", "Ottappalam", "Chalakudy", "Changanacherry", "Muvattupuzha",
    ],
  },
  {
    state: "Madhya Pradesh",
    cities: [
      "Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain",
      "Sagar", "Dewas", "Satna", "Ratlam", "Rewa",
      "Murwara", "Singrauli", "Burhanpur", "Khandwa", "Bhind",
      "Chhindwara", "Guna", "Shivpuri", "Vidisha", "Chhatarpur",
      "Damoh", "Mandsaur", "Khargone", "Neemuch", "Pithampur",
      "Seoni", "Narsinghpur", "Mandla", "Raisen", "Hoshangabad",
      "Itarsi", "Sehore", "Balaghat", "Shahdol", "Umaria",
    ],
  },
  {
    state: "Maharashtra",
    cities: [
      "Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad",
      "Solapur", "Amravati", "Kolhapur", "Nanded", "Sangli",
      "Malegaon", "Thane", "Kalyan", "Dombivli", "Vasai-Virar",
      "Bhiwandi", "Navi Mumbai", "Akola", "Latur", "Dhule",
      "Ahmednagar", "Chandrapur", "Parbhani", "Jalgaon", "Bhusawal",
      "Osmanabad", "Nandurbar", "Wardha", "Yavatmal", "Beed",
      "Hingoli", "Washim", "Buldhana", "Gondia", "Gadchiroli",
      "Ratnagiri", "Sindhudurg", "Raigad", "Satara", "Bhandara",
    ],
  },
  {
    state: "Manipur",
    cities: [
      "Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Kakching",
      "Senapati", "Ukhrul", "Chandel", "Tamenglong", "Jiribam",
    ],
  },
  {
    state: "Meghalaya",
    cities: [
      "Shillong", "Tura", "Jowai", "Nongpoh", "Baghmara",
      "Nongstoin", "Williamnagar", "Resubelpara", "Mairang", "Mawkyrwat",
    ],
  },
  {
    state: "Mizoram",
    cities: [
      "Aizawl", "Lunglei", "Champhai", "Saiha", "Kolasib",
      "Serchhip", "Mamit", "Lawngtlai", "Hnahthial", "Saitual",
    ],
  },
  {
    state: "Nagaland",
    cities: [
      "Kohima", "Dimapur", "Mokokchung", "Wokha", "Zunheboto",
      "Tuensang", "Mon", "Phek", "Peren", "Longleng",
      "Kiphire", "Noklak", "Tseminyu",
    ],
  },
  {
    state: "Odisha",
    cities: [
      "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur",
      "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda",
      "Bargarh", "Dhenkanal", "Kendujhar", "Koraput", "Sundargarh",
      "Nabarangapur", "Rayagada", "Kalahandi", "Bolangir", "Nuapada",
      "Angul", "Jagatsinghpur", "Kendrapara", "Jajpur", "Nayagarh",
    ],
  },
  {
    state: "Punjab",
    cities: [
      "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda",
      "Mohali", "Pathankot", "Hoshiarpur", "Moga", "Firozpur",
      "Abohar", "Malerkotla", "Khanna", "Phagwara", "Muktsar",
      "Barnala", "Rajpura", "Sangrur", "Fazilka", "Gurdaspur",
      "Kapurthala", "Fatehgarh Sahib", "Nawanshahr", "Rupnagar", "Tarn Taran",
    ],
  },
  {
    state: "Rajasthan",
    cities: [
      "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer",
      "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar",
      "Sri Ganganagar", "Pali", "Tonk", "Nagaur", "Chittorgarh",
      "Jhunjhunu", "Hanumangarh", "Banswara", "Dausa", "Sawai Madhopur",
      "Barmer", "Jaisalmer", "Bundi", "Jhalawar", "Karauli",
      "Pratapgarh", "Rajsamand", "Dholpur", "Dungarpur", "Sirohi",
      "Churu", "Baran", "Jalore", "Jalor",
    ],
  },
  {
    state: "Sikkim",
    cities: [
      "Gangtok", "Namchi", "Geyzing", "Mangan", "Ravangla",
      "Jorethang", "Singtam", "Rangpo", "Yuksom",
    ],
  },
  {
    state: "Tamil Nadu",
    cities: [
      "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem",
      "Tirunelveli", "Tiruppur", "Erode", "Vellore", "Thoothukudi",
      "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur",
      "Udhagamandalam", "Hosur", "Nagercoil", "Kanchipuram", "Kumbakonam",
      "Cuddalore", "Kanyakumari", "Pudukkottai", "Namakkal", "Krishnagiri",
      "Ariyalur", "Perambalur", "Villupuram", "Nagapattinam", "Ramanathapuram",
    ],
  },
  {
    state: "Telangana",
    cities: [
      "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam",
      "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Miryalaguda",
      "Secunderabad", "Ramagundam", "Mancherial", "Kothagudem", "Siddipet",
      "Jagtial", "Kamareddy", "Sangareddy", "Vikarabad", "Wanaparthy",
      "Nirmal", "Bhongir", "Jangaon", "Mahabubabad", "Mulugu",
    ],
  },
  {
    state: "Tripura",
    cities: [
      "Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia",
      "Ambassa", "Khowai", "Sonamura", "Sabroom", "Gomati",
    ],
  },
  {
    state: "Uttar Pradesh",
    cities: [
      "Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut",
      "Prayagraj", "Ghaziabad", "Noida", "Bareilly", "Aligarh",
      "Moradabad", "Saharanpur", "Gorakhpur", "Mathura", "Firozabad",
      "Muzaffarnagar", "Shahjahanpur", "Rampur", "Jhansi", "Hapur",
      "Ayodhya", "Jaunpur", "Sultanpur", "Azamgarh", "Mirzapur",
      "Bulandshahr", "Sitapur", "Lakhimpur", "Unnao", "Rae Bareli",
      "Bahraich", "Banda", "Fatehpur", "Gonda", "Deoria",
      "Ballia", "Etah", "Bijnor", "Hardoi", "Etawah",
      "Hathras", "Kasganj", "Auraiya", "Mainpuri", "Farrukhabad",
    ],
  },
  {
    state: "Uttarakhand",
    cities: [
      "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur",
      "Kashipur", "Rishikesh", "Nainital", "Mussoorie", "Kotdwar",
      "Pithoragarh", "Almora", "Bageshwar", "Chamoli", "Champawat",
      "Pauri Garhwal", "Tehri Garhwal", "Uttarkashi", "Rudraprayag",
    ],
  },
  {
    state: "West Bengal",
    cities: [
      "Kolkata", "Howrah", "Asansol", "Siliguri", "Durgapur",
      "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur",
      "Cooch Behar", "Haldia", "Raiganj", "Krishnanagar", "Medinipur",
      "Bankura", "Purulia", "Balurghat", "Jalpaiguri", "Darjeeling",
      "Alipurduar", "Bishnupur", "Contai", "Tamluk", "Diamond Harbour",
      "Bongaon", "Baruipur", "Basirhat", "Dumdum", "Serampore",
    ],
  },
  // ── Union Territories ────────────────────────────────────────────────────
  {
    state: "Andaman and Nicobar Islands",
    cities: [
      "Port Blair", "Diglipur", "Rangat", "Mayabunder", "Car Nicobar",
    ],
  },
  {
    state: "Chandigarh",
    cities: ["Chandigarh"],
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    cities: ["Silvassa", "Daman", "Diu", "Amli", "Naroli"],
  },
  {
    state: "Delhi",
    cities: [
      "New Delhi", "Central Delhi", "North Delhi", "South Delhi", "East Delhi",
      "West Delhi", "North East Delhi", "North West Delhi", "South East Delhi",
      "South West Delhi", "Shahdara", "Dwarka", "Rohini",
    ],
  },
  {
    state: "Jammu and Kashmir",
    cities: [
      "Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore",
      "Udhampur", "Kathua", "Rajouri", "Punch", "Reasi",
      "Doda", "Kishtwar", "Ramban", "Kupwara", "Bandipore",
      "Ganderbal", "Kulgam", "Shopian", "Pulwama", "Budgam",
    ],
  },
  {
    state: "Ladakh",
    cities: ["Leh", "Kargil", "Zanskar", "Nubra", "Drass"],
  },
  {
    state: "Lakshadweep",
    cities: ["Kavaratti", "Agatti", "Amini", "Andrott", "Minicoy"],
  },
  {
    state: "Puducherry",
    cities: ["Puducherry", "Karaikal", "Mahe", "Yanam", "Oulgaret", "Villianur"],
  },
];

async function seedLocations() {
  await sequelize.authenticate();
  console.log("Connected to database.\n");

  let statesCreated = 0;
  let statesSkipped = 0;
  let citiesCreated = 0;
  let citiesSkipped = 0;

  for (const entry of INDIA) {
    // Upsert state
    const [stateRow, wasNew] = await State.findOrCreate({
      where: { name: entry.state },
      defaults: { name: entry.state, status: true },
    });

    if (wasNew) {
      console.log(`✓ State: ${entry.state}`);
      statesCreated++;
    } else {
      console.log(`– State: ${entry.state} (exists)`);
      statesSkipped++;
    }

    // Bulk-upsert cities for this state
    const existing = await City.findAll({
      where: { state_id: stateRow.id },
      attributes: ["name"],
    });
    const existingNames = new Set(existing.map((c) => c.name));

    const toInsert = entry.cities
      .filter((name) => !existingNames.has(name))
      .map((name) => ({ name, state_id: stateRow.id, status: true as boolean }));

    if (toInsert.length > 0) {
      await City.bulkCreate(toInsert, { ignoreDuplicates: true });
      console.log(`   + ${toInsert.length} cities added`);
      citiesCreated += toInsert.length;
    }

    const alreadyThere = entry.cities.length - toInsert.length;
    if (alreadyThere > 0) {
      console.log(`   – ${alreadyThere} cities already existed`);
      citiesSkipped += alreadyThere;
    }
  }

  console.log(`\n─────────────────────────────────────────────`);
  console.log(`States  — ${statesCreated} created, ${statesSkipped} already existed`);
  console.log(`Cities  — ${citiesCreated} created, ${citiesSkipped} already existed`);
  console.log(`─────────────────────────────────────────────`);

  await sequelize.close();
}

seedLocations().catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
