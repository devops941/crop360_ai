const mongoose = require('mongoose');

const uri = 'mongodb+srv://devops_db_user:jcj8Mkf1GQKJ1ZGl@cluster0.uurxkmz.mongodb.net/agri?retryWrites=true&w=majority';

async function seedData() {
  await mongoose.connect(uri, { dbName: 'agri' });
  console.log('Connected to MongoDB Atlas...');

  const db = mongoose.connection.db;

  // 1. Locate the authenticated Gokul user
  const user = await db.collection('users').findOne({ email: 'gokulnath2k24@gmail.com' });
  if (!user) {
    throw new Error('User with email gokulnath2k24@gmail.com not found!');
  }
  const userId = user._id;
  console.log(`Found active user Gokul: ${userId.toString()} (${user.email})`);

  // 2. Insert 2 Farmers owned by Gokul
  const farmer1Id = new mongoose.Types.ObjectId();
  const farmer2Id = new mongoose.Types.ObjectId();

  await db.collection('farmers').insertMany([
    {
      _id: farmer1Id,
      farmerCode: 'FMR-TN-DGL-001',
      name: 'Gokulnath Selvam',
      phone: '9876543210',
      email: 'gokulnath2k24@gmail.com',
      category: 'small',
      village: 'Reddiarchatram',
      taluk: 'Dindigul West',
      district: 'Dindigul',
      state: 'Tamil Nadu',
      pincode: '624622',
      preferredLanguage: 'ta',
      status: 'active',
      createdBy: userId.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: farmer2Id,
      farmerCode: 'FMR-TN-DGL-002',
      name: 'Murugesan Palanisamy',
      phone: '9842109876',
      email: 'murugan.farm@gmail.com',
      category: 'marginal',
      village: 'Athoor',
      taluk: 'Athoor',
      district: 'Dindigul',
      state: 'Tamil Nadu',
      pincode: '624701',
      preferredLanguage: 'ta',
      status: 'active',
      createdBy: userId.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log('✓ Inserted 2 Farmers');

  // 3. Insert 2 Farms
  const farm1Id = new mongoose.Types.ObjectId();
  const farm2Id = new mongoose.Types.ObjectId();

  await db.collection('farms').insertMany([
    {
      _id: farm1Id,
      farmerId: farmer1Id,
      parcelName: 'North Vayal (Paddy Wetland)',
      surveyNumber: '142/3A',
      totalAreaAcres: 3.5,
      cultivableAreaAcres: 3.5,
      soilType: 'alluvial',
      irrigationSource: 'canal',
      waterAvailabilityMonths: 10,
      village: 'Reddiarchatram',
      district: 'Dindigul',
      state: 'Tamil Nadu',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: farm2Id,
      farmerId: farmer2Id,
      parcelName: 'South Garden (Drip Line)',
      surveyNumber: '88/2B',
      totalAreaAcres: 2.0,
      cultivableAreaAcres: 2.0,
      soilType: 'red_loam',
      irrigationSource: 'borewell',
      waterAvailabilityMonths: 12,
      village: 'Athoor',
      district: 'Dindigul',
      state: 'Tamil Nadu',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log('✓ Inserted 2 Farms');

  // 4. Insert 2 Seed Catalog items for Gokul
  const seed1Id = new mongoose.Types.ObjectId();
  const seed2Id = new mongoose.Types.ObjectId();

  await db.collection('seed_catalog').insertMany([
    {
      _id: seed1Id,
      userId: userId,
      cropName: 'Paddy (Rice / Samba / Kuruvai)',
      varietyName: 'CO 51 (Short Duration Submergence Tolerant)',
      category: 'cereal',
      sourceBreeder: 'Tamil Nadu Agricultural University (TNAU) Coimbatore',
      seedCategory: 'certified',
      germinationRatePercent: 88,
      seedRatePerAcreKg: '12 kg',
      seedRateKgNumber: 12,
      costPerKgInr: 45,
      stockAvailableKg: 150,
      durationDays: '105 - 110 days',
      pestResistanceTraits: ['Blast Resistant', 'BPH Tolerant'],
      seedTreatmentAdvisory: {
        fungicideTreatment: 'Carbendazim @ 2g/kg',
        biofertilizerInoculation: 'Azospirillum @ 200g/acre',
        soakingDurationHours: 12,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: seed2Id,
      userId: userId,
      cropName: 'Tomato (Hybrid / Thakkali)',
      varietyName: 'Shivam Hybrid (High Yielding F1)',
      category: 'vegetable',
      sourceBreeder: 'Syngenta India / IIHR Bangalore',
      seedCategory: 'hybrid',
      germinationRatePercent: 92,
      seedRatePerAcreKg: '60 grams',
      seedRateKgNumber: 0.06,
      costPerKgInr: 12000,
      stockAvailableKg: 5,
      durationDays: '130 - 140 days',
      pestResistanceTraits: ['ToLCV Resistant', 'Bacterial Wilt Tolerant'],
      seedTreatmentAdvisory: {
        fungicideTreatment: 'Thiram @ 2g/kg',
        biofertilizerInoculation: 'Pseudomonas @ 10g/kg',
        soakingDurationHours: 6,
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log('✓ Inserted 2 Seed Catalog entries');

  // 5. Insert 2 Soil Reports
  const report1Id = new mongoose.Types.ObjectId();
  const report2Id = new mongoose.Types.ObjectId();

  await db.collection('soil_reports').insertMany([
    {
      _id: report1Id,
      sampleCode: 'SHC-DGL-2026-001',
      farmerId: farmer1Id,
      farmId: farm1Id,
      testDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      testingLabName: 'TNAU Soil Testing Laboratory, Kudumiyanmalai',
      testingLabCode: 'TNAU-LAB-01',
      sourceType: 'manual_entry',
      sampleDepthInches: 8,
      parameters: {
        pH: 6.8,
        electricalConductivity: 0.45,
        organicCarbon: 0.62,
        nitrogen: 245,
        phosphorus: 18.5,
        potassium: 280,
        sulphur: 12,
        zinc: 1.2,
        boron: 0.55,
        iron: 5.4,
        manganese: 3.2,
        copper: 0.8,
      },
      status: 'card_generated',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: report2Id,
      sampleCode: 'SHC-DGL-2026-002',
      farmerId: farmer2Id,
      farmId: farm2Id,
      testDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      testingLabName: 'Government Soil Testing Laboratory, Dindigul',
      testingLabCode: 'GOV-DGL-02',
      sourceType: 'manual_entry',
      sampleDepthInches: 9,
      parameters: {
        pH: 7.2,
        electricalConductivity: 0.38,
        organicCarbon: 0.55,
        nitrogen: 210,
        phosphorus: 22.0,
        potassium: 310,
        sulphur: 14,
        zinc: 0.9,
        boron: 0.45,
        iron: 4.8,
        manganese: 2.9,
        copper: 0.7,
      },
      status: 'card_generated',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log('✓ Inserted 2 Soil Reports');

  // 6. Insert 2 Soil Health Cards
  await db.collection('soil_health_cards').insertMany([
    {
      cardNumber: 'SHC-CRD-2026-001',
      reportId: report1Id,
      farmerId: farmer1Id,
      farmId: farm1Id,
      issuedDate: new Date(),
      expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
      qrVerificationCode: 'SHC-QR-DGL-001',
      cycle: 'Cycle 2026-2029',
      cardDataSnapshot: {
        farmerName: 'Gokulnath Selvam',
        farmerCode: 'FMR-TN-DGL-001',
        phone: '9876543210',
        district: 'Dindigul',
        state: 'Tamil Nadu',
        parcelName: 'North Vayal (Paddy Wetland)',
        surveyNumber: '142/3A',
        totalAreaAcres: 3.5,
        soilType: 'alluvial',
        overallHealthScore: 82,
        fertilityRating: 'Good',
        phValue: 6.8,
        ecValue: 0.45,
        ocValue: 0.62,
        nitrogenValue: 245,
        phosphorusValue: 18.5,
        potassiumValue: 280,
        topRecommendations: [
          'Apply 5 tonnes FYM per acre as basal dose',
          'Inoculate seeds with Azospirillum @ 200g/acre',
        ],
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      cardNumber: 'SHC-CRD-2026-002',
      reportId: report2Id,
      farmerId: farmer2Id,
      farmId: farm2Id,
      issuedDate: new Date(),
      expiryDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
      qrVerificationCode: 'SHC-QR-DGL-002',
      cycle: 'Cycle 2026-2029',
      cardDataSnapshot: {
        farmerName: 'Murugesan Palanisamy',
        farmerCode: 'FMR-TN-DGL-002',
        phone: '9842109876',
        district: 'Dindigul',
        state: 'Tamil Nadu',
        parcelName: 'South Garden (Drip Line)',
        surveyNumber: '88/2B',
        totalAreaAcres: 2.0,
        soilType: 'red_loam',
        overallHealthScore: 78,
        fertilityRating: 'Medium',
        phValue: 7.2,
        ecValue: 0.38,
        ocValue: 0.55,
        nitrogenValue: 210,
        phosphorusValue: 22.0,
        potassiumValue: 310,
        topRecommendations: [
          'Apply Zinc Sulphate @ 10kg/acre',
          'Incorporate Vermicompost @ 2 tonnes/acre',
        ],
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log('✓ Inserted 2 Soil Health Cards');

  // 7. Insert 2 Land Preparation Plans
  await db.collection('land_prep_plans').insertMany([
    {
      farmerId: farmer1Id,
      farmId: farm1Id,
      cropName: 'Paddy (Rice)',
      season: 'Samba Season',
      tillageType: 'puddled_wetland',
      basalFYMApplicationTonnesPerAcre: 5,
      readinessScorePercent: 100,
      status: 'seedbed_ready',
      operations: [
        {
          stepNumber: 1,
          operationName: 'Dry Summer Mouldboard Ploughing',
          implementType: 'mouldboard_plough',
          targetDepthInches: 9,
          timingDaysBeforeSowing: 21,
          purpose: 'Deep inversion of soil & weed destruction',
          isCompleted: true,
          completedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        },
        {
          stepNumber: 2,
          operationName: 'Wet Puddling & Leveling',
          implementType: 'rotavator',
          targetDepthInches: 6,
          timingDaysBeforeSowing: 3,
          purpose: 'Creating impermeable hardpan for standing water',
          isCompleted: true,
          completedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      farmerId: farmer2Id,
      farmId: farm2Id,
      cropName: 'Tomato (Hybrid)',
      season: 'Rabi Season',
      tillageType: 'conventional',
      basalFYMApplicationTonnesPerAcre: 6,
      readinessScorePercent: 75,
      status: 'in_progress',
      operations: [
        {
          stepNumber: 1,
          operationName: 'Primary Disc Ploughing',
          implementType: 'disc_harrow',
          targetDepthInches: 10,
          timingDaysBeforeSowing: 15,
          purpose: 'Pulverizing clods & hardpan breaking',
          isCompleted: true,
          completedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          stepNumber: 2,
          operationName: 'Raised Bed & Furrow Ridging',
          implementType: 'ridger',
          targetDepthInches: 6,
          timingDaysBeforeSowing: 2,
          purpose: 'Drip line layout & root aeration',
          isCompleted: false,
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log('✓ Inserted 2 Land Preparation Plans');

  // 8. Insert 2 Sowing Records
  await db.collection('sowing_records').insertMany([
    {
      farmerId: farmer1Id,
      farmId: farm1Id,
      cropName: 'Paddy (Rice / Samba)',
      varietyName: 'CO 51',
      sowingDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      plantingMethod: 'transplanting',
      spacingCm: {
        rowToRowCm: 20,
        plantToPlantCm: 15,
      },
      plantPopulationPerAcre: 133333,
      nurseryAgeDays: 18,
      targetHarvestDateEstimated: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000),
      actualSeedRateUsedKg: 12,
      depthOfSowingCm: 3,
      status: 'germination_verified',
      notes: 'Transplanted in wet puddle bed. 100% germination established.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      farmerId: farmer2Id,
      farmId: farm2Id,
      cropName: 'Tomato (Hybrid / Thakkali)',
      varietyName: 'Shivam Hybrid',
      sowingDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      plantingMethod: 'drip_fertigation_line',
      spacingCm: {
        rowToRowCm: 60,
        plantToPlantCm: 45,
      },
      plantPopulationPerAcre: 14815,
      nurseryAgeDays: 25,
      targetHarvestDateEstimated: new Date(Date.now() + 125 * 24 * 60 * 60 * 1000),
      actualSeedRateUsedKg: 0.06,
      depthOfSowingCm: 2,
      status: 'sown',
      notes: 'Planted on raised beds with inline drip lines.',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
  console.log('✓ Inserted 2 Sowing Records');

  console.log('\n=======================================');
  console.log('ALL SAMPLE DATA INSERTED FOR GOKUL SUCCESSFULLY!');
  console.log('=======================================');

  await mongoose.disconnect();
}

seedData().catch((err) => {
  console.error('Fatal error seeding data:', err);
  process.exit(1);
});
