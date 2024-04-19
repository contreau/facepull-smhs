export class linkedRow {
  constructor(name, titles, profileURL, emailURL) {
    this.name = name;
    let titleString = "";
    if (titles.length > 1) {
      for (let i = 0; i < titles.length; i++) {
        if (i !== titles.length - 1) {
          titles[i] = titles[i] + "<br>";
        }
      }
    }
    for (let title of titles) {
      titleString += title;
    }
    this.titles = titleString;
    this.profileURL = profileURL;
    this.emailURL = emailURL;
    this.html = `
    <tr>
      <td>
        <div class="picture-frame">
          <div class="field--type-image">
            <img
              class="img-responsive"
              loading="lazy"
              src="https://smhs.gwu.edu/sites/g/files/zaskib1151/files/styles/1920_x_variable/public/2024-04/avatar-headshot--200x245.jpg?itok=_5durzkz"
              width="200"
              height="245"
              alt="Avatar wearing GW white coat"
              typeof="foaf:Image"
            />
          </div>
        </div>
      </td>
      <td>
        <div class="faculty-info">
          <p class="mdbluetext">
            <a href="${this.profileURL}" target="_blank">${this.name}</a>
          </p>
          <p class="highlighted-text">${this.titles}</p>
          <div class="faculty-icon--container">
            <a
              href="${this.profileURL}"
              target="_blank"
              aria-label="View faculty profile"
              role="button"
              ><span class="faculty-icon--color"
                ><span class="fontawesome-icon-inline"
                  ><span class="fa-sharp fa-regular fa-address-card fa-lg">
                  </span> </span></span
            ></a>
          </div>
          <div class="faculty-icon--container">
            <a
              href="${this.emailURL}"
              target="_blank"
              aria-label="Send email"
              role="button"
              ><span class="faculty-icon--color"
                ><span class="fontawesome-icon-inline"
                  ><span class="fa-sharp fa-regular fa-envelope fa-lg">
                  </span> </span></span
            ></a>
          </div>
        </div>
      </td>
    </tr>
    `;
  }
}

export class nullRow {
  constructor(name, titles) {
    this.name = name;
    this.titles = titles;
    this.html = `
    <tr>
      <td>
        <div class="picture-frame">
          <div class="field--type-image">
            <img
              class="img-responsive"
              loading="lazy"
              src="https://smhs.gwu.edu/sites/g/files/zaskib1151/files/styles/1920_x_variable/public/2024-04/avatar-headshot--200x245.jpg?itok=_5durzkz"
              width="200"
              height="245"
              alt="Avatar wearing GW white coat"
              typeof="foaf:Image"
            />
          </div>
        </div>
      </td>
      <td>
        <div class="faculty-info">
          <p class="mdbluetext">${this.name}</p>
          <p class="highlighted-text">${this.titles}</p>
        </div>
      </td>
    </tr>
    `;
  }
}
