import sequelize from "../config/database";

const STATES_AND_CITIES: { state: string; cities: string[] }[] = [
  {
    state: "Andhra Pradesh",
    cities: ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajamahendravaram", "Kadapa", "Tirupati", "Kakinada", "Anantapur"],
  },
  {
    state: "Arunachal Pradesh",
    cities: ["Itanagar", "Naharlagun", "Pasighat", "Namsai", "Bomdila"],
  },
  {
    state: "Assam",
    cities: ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Dhubri", "Diphu"],
  },
  {
    state: "Bihar",
    cities: ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar"],
  },
  {
    state: "Chhattisgarh",
    cities: ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Dhamtari"],
  },
  {
    state: "Goa",
    cities: ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Sanquelim"],
  },
  {
    state: "Gujarat",
    cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Navsari", "Morbi", "Nadiad"],
  },
  {
    state: "Haryana",
    cities: ["Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula"],
  },
  {
    state: "Himachal Pradesh",
    cities: ["Shimla", "Mandi", "Solan", "Dharamshala", "Baddi", "Palampur", "Kullu", "Manali", "Hamirpur", "Bilaspur"],
  },
  {
    state: "Jharkhand",
    cities: ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro Steel City", "Deoghar", "Phusro", "Hazaribagh", "Giridih", "Ramgarh", "Medininagar"],
  },
  {
    state: "Karnataka",
    cities: ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Kalaburagi", "Ballari", "Vijayapura", "Shivamogga", "Tumkur", "Davanagere", "Udupi"],
  },
  {
    state: "Kerala",
    cities: ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Kannur", "Kottayam", "Malappuram"],
  },
  {
    state: "Madhya Pradesh",
    cities: ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa", "Murwara", "Singrauli"],
  },
  {
    state: "Maharashtra",
    cities: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Nanded", "Sangli", "Malegaon", "Jalgaon", "Akola", "Latur"],
  },
  {
    state: "Manipur",
    cities: ["Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Senapati"],
  },
  {
    state: "Meghalaya",
    cities: ["Shillong", "Tura", "Nongstoin", "Jowai", "Baghmara"],
  },
  {
    state: "Mizoram",
    cities: ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib"],
  },
  {
    state: "Nagaland",
    cities: ["Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha"],
  },
  {
    state: "Odisha",
    cities: ["Bhubaneswar", "Cuttack", "Rourkela", "Brahmapur", "Sambalpur", "Puri", "Balasore", "Bhadrak", "Baripada", "Jharsuguda"],
  },
  {
    state: "Punjab",
    cities: ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Hoshiarpur", "Batala", "Pathankot", "Moga"],
  },
  {
    state: "Rajasthan",
    cities: ["Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar", "Pali", "Sri Ganganagar"],
  },
  {
    state: "Sikkim",
    cities: ["Gangtok", "Namchi", "Mangan", "Gyalshing", "Rangpo"],
  },
  {
    state: "Tamil Nadu",
    cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukkudi", "Dindigul", "Thanjavur"],
  },
  {
    state: "Telangana",
    cities: ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Secunderabad", "Mahbubnagar", "Nalgonda", "Adilabad"],
  },
  {
    state: "Tripura",
    cities: ["Agartala", "Udaipur", "Dharmanagar", "Kailasahar", "Belonia"],
  },
  {
    state: "Uttar Pradesh",
    cities: ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Meerut", "Varanasi", "Prayagraj", "Bareilly", "Aligarh", "Moradabad", "Saharanpur", "Gorakhpur", "Noida", "Firozabad", "Jhansi"],
  },
  {
    state: "Uttarakhand",
    cities: ["Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Kashipur", "Rishikesh", "Kotdwar", "Ramnagar", "Mussoorie"],
  },
  {
    state: "West Bengal",
    cities: ["Kolkata", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Malda", "Barasat", "Krishnanagar", "Habra", "Raiganj", "Kharagpur", "Haldia"],
  },
  {
    state: "Delhi",
    cities: ["New Delhi", "Delhi"],
  },
  {
    state: "Jammu and Kashmir",
    cities: ["Srinagar", "Jammu", "Anantnag", "Sopore", "Baramulla", "Kathua", "Punch", "Udhampur"],
  },
  {
    state: "Ladakh",
    cities: ["Leh", "Kargil"],
  },
  {
    state: "Chandigarh",
    cities: ["Chandigarh"],
  },
  {
    state: "Puducherry",
    cities: ["Puducherry", "Karaikal", "Mahe", "Yanam"],
  },
  {
    state: "Andaman and Nicobar Islands",
    cities: ["Port Blair", "Car Nicobar", "Diglipur"],
  },
  {
    state: "Dadra and Nagar Haveli and Daman and Diu",
    cities: ["Daman", "Diu", "Silvassa"],
  },
  {
    state: "Lakshadweep",
    cities: ["Kavaratti", "Agatti", "Amini"],
  },
];

(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connected to database.");

    let statesCreated = 0;
    let citiesCreated = 0;

    for (const entry of STATES_AND_CITIES) {
      // Upsert state
      const [stateRows] = await sequelize.query(
        `SELECT id FROM states WHERE name = ? LIMIT 1`,
        { replacements: [entry.state] },
      ) as [Array<{ id: number }>, unknown];

      let stateId: number;
      if (stateRows.length > 0) {
        stateId = stateRows[0]!.id;
      } else {
        await sequelize.query(
          `INSERT INTO states (name, status) VALUES (?, 1)`,
          { replacements: [entry.state] },
        );
        const [newState] = await sequelize.query(
          `SELECT id FROM states WHERE name = ? LIMIT 1`,
          { replacements: [entry.state] },
        ) as [Array<{ id: number }>, unknown];
        stateId = newState[0]!.id;
        statesCreated++;
        console.log(`  + State: ${entry.state}`);
      }

      // Upsert cities
      for (const cityName of entry.cities) {
        const [cityRows] = await sequelize.query(
          `SELECT id FROM cities WHERE name = ? AND state_id = ? LIMIT 1`,
          { replacements: [cityName, stateId] },
        ) as [Array<{ id: number }>, unknown];

        if (cityRows.length === 0) {
          await sequelize.query(
            `INSERT INTO cities (name, state_id, status) VALUES (?, ?, 1)`,
            { replacements: [cityName, stateId] },
          );
          citiesCreated++;
        }
      }
    }

    console.log(`\nDone. States added: ${statesCreated}, Cities added: ${citiesCreated}`);
    process.exit(0);
  } catch (err) {
    console.error("Seed failed:", err);
    process.exit(1);
  }
})();
