import { fetchRecords } from "./fetchRecords.js";

async function createTables() {
  const records = await fetchRecords();
  console.log(records);
}

createTables();
