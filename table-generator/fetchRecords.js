import { JSDOM } from "jsdom";
import promptSync from "prompt-sync";
import chalk from "chalk";

// *** FACULTY RECORD SCRAPER ***

export async function fetchRecords() {
  const prompt = promptSync();
  const url = prompt("Provide a valid faculty page URL: ");
  const res = await fetch(url);
  const html = await res.text();
  const document = new JSDOM(html).window.document;
  const container = document.querySelector('[role="main"]');
  const rows = Array.from(container.querySelectorAll("tr"));

  let lastKnownFaculty; // for debugging
  let facultyCount = 0; // for CLI

  console.clear();
  console.log(chalk.hex("#007cff").bold("Retrieving faculty records..."));

  try {
    const time1 = performance.now();
    const allFaculty = rows.map(async (row) => {
      let facultyName = null;
      let facultyTitles = null;
      let profileURL = null;
      let emailURL = null;
      const infoColumn = row.children[1];

      // * Name *
      if (infoColumn === undefined) {
        return undefined;
      }
      facultyName = infoColumn.children[0].textContent.trim().split("\n")[0];

      // * Titles *
      facultyTitles = infoColumn.textContent.split("\n");
      if (facultyTitles.slice(1).length > 1) {
        facultyTitles = facultyTitles
          .map((item) => item.trim())
          .filter((item) => item !== "");
        facultyTitles.splice(0, 1);
      } else {
        facultyTitles.splice(0, 1);
        let titleString = facultyTitles[0];
        const breaks = identifyLineBreaks(titleString);
        let insertionIndices = [];
        for (let br of breaks) {
          let index = titleString.indexOf(br);
          insertionIndices.push(index);
        }
        titleString = titleString.split("");
        for (let index of insertionIndices) {
          if (titleString[index + 1] === ")") {
            titleString.splice(index + 2, 0, "!");
          } else {
            titleString.splice(index + 1, 0, "!");
          }
        }
        titleString = titleString.join("");
        facultyTitles = titleString.split("!").filter((title) => title !== "");
      }

      function identifyLineBreaks(stringInput) {
        if (stringInput === "") {
          return [];
        } else {
          let store = identifyLineBreaks(stringInput.slice(1));
          if (stringInput[0] !== stringInput[0].toUpperCase()) {
            // check if character to the immediate right is uppercase
            if (stringInput[1] !== undefined) {
              if (
                stringInput[1] === stringInput[1].toUpperCase() &&
                stringInput[1] !== " " &&
                stringInput[1] !== ","
              ) {
                let target = stringInput[0] + stringInput[1];
                store.push(target);
                return store;
              }
            }
          }
          return store;
        }
      }

      // * Links *
      // Profile
      let dom = new JSDOM(infoColumn.innerHTML).window.document;
      const baseProfileURL =
        dom.querySelector("a")?.attributes["href"].value ?? null;
      if (baseProfileURL !== null) {
        const res1 = await fetch(baseProfileURL);
        const res1text = await res1.text();
        if (!res1text.includes("No Record Found")) {
          profileURL = res1.url;
          // Email
          const baseEmailURL =
            dom.querySelector("a img")?.parentNode.attributes["href"].value ??
            null;
          if (baseEmailURL !== null) {
            const res2 = await fetch(baseEmailURL);
            emailURL = res2.url;
          }
        }
      }

      const facultyRecord = {
        name: facultyName,
        titles: facultyTitles,
        profileURL: profileURL,
        emailURL: emailURL,
      };

      lastKnownFaculty = facultyRecord;
      facultyCount++;
      return facultyRecord;
    });

    // unpacks promises in allFaculty to create the final array
    let finalFacultyRecords = [];
    for (let f of allFaculty) {
      const record = await f;
      finalFacultyRecords.push(record);
    }
    finalFacultyRecords = finalFacultyRecords.filter(
      (item) => item !== undefined
    );
    const time2 = performance.now();
    console.log(
      chalk.hex("#00ff9f").bold(`\nRetrieved`),
      facultyCount,
      chalk.hex("#00ff9f").bold(`records in`),
      Math.floor(time2 - time1),
      chalk.hex("#00ff9f").bold(`ms.\n`)
    );
    return finalFacultyRecords;
  } catch (err) {
    console.error(err);
    console.log(lastKnownFaculty);
  }
}
