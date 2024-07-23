import { JSDOM } from "jsdom";
import chalk from "chalk";

export async function processRecords(table, deleteNullEntries) {
  const rows = Array.from(table.querySelectorAll("tr"));

  let lastKnownFaculty; // for debugging
  let facultyCount = 0; // for CLI
  let emptyRecords = {
    count: 0,
    names: [],
  };
  const facultyWithHeadshots = [];

  console.clear();
  console.log(chalk.hex("#007cff").bold("Processing faculty rows..."));

  try {
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

      if (infoColumn.children[0] === undefined) {
        facultyName = infoColumn.textContent.trim();
      } else {
        facultyName = infoColumn.children[0].textContent.trim().split("\n")[0];
      }

      // * Check for Placeholder Image *
      const imgColumn = new JSDOM(row.children[0].innerHTML).window.document;
      const img = imgColumn.querySelector("img");
      if (img !== null && !img.src.includes("georgehead")) {
        facultyWithHeadshots.push(" " + facultyName);
      }

      // * Titles *
      facultyTitles = infoColumn.textContent.split("\n");
      if (facultyTitles.slice(1).length > 1) {
        facultyTitles = facultyTitles
          .map((item) => item.trim())
          .filter((item) => item !== "");
        facultyTitles.splice(0, 1);
      } else {
        // handles when titles are all found in one string
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
        facultyTitles.splice(0, 1); // removes their name from the titles array
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
        dom.querySelector("a")?.attributes["href"]?.value ?? null;
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
            try {
              const res2 = await fetch(baseEmailURL);
              emailURL = res2.url;
            } catch (e) {
              if (baseEmailURL.includes("mailto:")) {
                emailURL = baseEmailURL;
              }
            }
          }
        } else if (res1text.includes("No Record Found")) {
          if (deleteNullEntries) {
            emptyRecords.count++;
            emptyRecords.names.push(facultyName);
            return undefined;
          }
          emptyRecords.count++;
          emptyRecords.names.push(facultyName);
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
    return {
      records: finalFacultyRecords,
      headshots: facultyWithHeadshots,
      empty: emptyRecords,
    };
  } catch (err) {
    console.error(err);
    console.log(lastKnownFaculty);
  }
}
