import fs from "fs";
import { JSDOM } from "jsdom";
import promptSync from "prompt-sync";
import chalk from "chalk";

// TODO: fetch each directory link to check if the entry exists, and if so, get the most updated one and replace it

async function mainFetch(url) {
  const res = await fetch(url);
  const html = await res.text();
  const document = new JSDOM(html).window.document;
  const container = document.querySelector('[role="main"]');
  const rows = Array.from(container.querySelectorAll("tr"));
  let lastKnownFaculty; // for debugging

  try {
    const allFaculty = rows
      .map((row) => {
        let facultyName = null;
        let facultyTitles = null;
        let profileURL = null;
        let emailURL = null;
        const infoColumn = row.children[1];

        // Name
        if (infoColumn === undefined) {
          return undefined;
        }
        facultyName = infoColumn.children[0].textContent.trim().split("\n")[0];

        // Titles
        facultyTitles = infoColumn.textContent
          .split("\n")
          .map((item) => item.trim())
          .filter((item) => item !== "");
        facultyTitles.splice(0, 1);

        // Profile
        let dom = new JSDOM(infoColumn.children[0].innerHTML).window.document;
        profileURL = dom.querySelector("a")?.attributes["href"].value ?? null;

        // Email
        dom = new JSDOM(infoColumn.innerHTML).window.document;
        emailURL =
          dom.querySelector("a img")?.parentNode.attributes["href"].value ??
          null;

        const facultyObject = {
          name: facultyName,
          titles: facultyTitles,
          profileURL: profileURL,
          emailURL: emailURL,
        };

        lastKnownFaculty = facultyObject;
        return facultyObject;
      })
      .filter((item) => item !== undefined);
    console.log(allFaculty);
  } catch (err) {
    console.error(err);
    console.log(lastKnownFaculty);
  }
}

mainFetch("https://psychiatry.smhs.gwu.edu/faculty");
