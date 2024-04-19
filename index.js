import fs from "fs";
import path from "path";
import { fetchRecords } from "./lib/fetchRecords.js";
import { linkedRow, nullRow } from "./lib/rowTemplates.js";

async function createTables() {
  const res = await fetchRecords();
  const { records, url, heading } = res;
  const department = `${url.split(".smhs")[0].split("//")[1]}`;
  let htmlFileName;
  if (department === "medicine") {
    const rawText = heading.trim().split(" ");
    rawText.splice(rawText.indexOf(rawText.at(-1)), 1);
    htmlFileName = "medicine-" + rawText.join("");
  } else {
    htmlFileName = department;
  }

  let rows = "";
  // TODO: finish row appending and add <br> to titles
  // for (let faculty of records) {
  //   if (faculty.profileURL === null) {
  //   }
  // }

  const tableHtml = `
  <div class="table-responsive">
    <table class="table table-hover table-faculty">
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
  `;
  fs.writeFile(
    path.join("./html", `${htmlFileName}.html`),
    tableHtml,
    (error) => {
      error ? console.error(error) : true;
    }
  );
}

createTables();
