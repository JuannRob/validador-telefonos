import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import parsePhoneNumber from "libphonenumber-js/max";

// Lee el archivo CSV
const csvData = fs.readFileSync("barq_subs_active.csv", "utf8");

// Configura las opciones de parseo de CSV
const records = parse(csvData, {
  columns: true, // Asume que la primera fila contiene los nombres de las columnas
  skip_empty_lines: true,
});

// Lee el archivo JSON de forma sincrónica
const phonesJson = fs.readFileSync("phones_final.json", "utf8");
const phonesData = JSON.parse(phonesJson);

let correctPhones = [];
let incorrectPhones = [];

// Itera sobre los registros del CSV
for (const record of records) {
  const phoneNumber = record["Phone"];
  const country = record["Country"];

  const matchingCountry = phonesData.find(
    (countryData) =>
      countryData.countryEn === country ||
      countryData.countrySpa === country ||
      countryData.iso === country
  );

  let countryIso = "";
  if (matchingCountry) {
    countryIso = matchingCountry.iso;
  } else {
    console.log(`Country not found: ${country}`);
  }

  if (countryIso) {
    const parsedNumber = parsePhoneNumber(phoneNumber, countryIso);

    if (parsedNumber && parsedNumber.isValid()) {
      let formattedNumber = parsedNumber.formatInternational();

      formattedNumber = formattedNumber.replace(/\s+/g, "");

      // Modifica el número para Argentina y México
      if (countryIso === "AR" && formattedNumber.startsWith("+54")) {
        formattedNumber = formattedNumber.replace("+54", "+549");
      } else if (countryIso === "MX" && formattedNumber.startsWith("+52")) {
        formattedNumber = formattedNumber.replace("+52", "+521");
      }

      record["FormattedPhone"] = formattedNumber;

      correctPhones.push(record);
    } else {
      incorrectPhones.push(record);
    }
  } else {
    incorrectPhones.push(record);
  }
}

// Escribir los registros válidos en un archivo CSV
const validCsvString = stringify(correctPhones, { header: true });
fs.writeFileSync("validated_phones.csv", validCsvString);

// Escribir los registros inválidos en un archivo CSV
const invalidCsvString = stringify(incorrectPhones, { header: true });
fs.writeFileSync("invalid_phones.csv", invalidCsvString);
