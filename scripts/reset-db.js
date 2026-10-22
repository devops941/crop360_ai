const mongoose = require('mongoose');

const uri = 'mongodb+srv://devops_db_user:jcj8Mkf1GQKJ1ZGl@cluster0.uurxkmz.mongodb.net/agri?retryWrites=true&w=majority';

async function resetDb() {
  await mongoose.connect(uri, { dbName: 'agri' });
  console.log('Connected to MongoDB Atlas (database: agri)');

  const collections = await mongoose.connection.db.listCollections().toArray();
  let totalDeleted = 0;

  for (const c of collections) {
    try {
      const col = mongoose.connection.db.collection(c.name);
      const count = await col.countDocuments();
      if (count > 0) {
        await col.deleteMany({});
        console.log('✓ Cleared ' + count + ' records from ' + c.name);
        totalDeleted += count;
      } else {
        console.log('- ' + c.name + ': already empty (0 records)');
      }
    } catch (err) {
      console.warn('! Error clearing ' + c.name + ': ' + err.message);
    }
  }

  console.log('\n=======================================');
  console.log('ENTIRE DATABASE FULLY CLEARED (TOTAL RECORDS REMOVED: ' + totalDeleted + ')');
  console.log('=======================================');

  await mongoose.disconnect();
}

resetDb().catch((err) => {
  console.error('Fatal error resetting database:', err);
  process.exit(1);
});
