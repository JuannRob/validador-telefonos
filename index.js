import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";
import parsePhoneNumber from "libphonenumber-js/max";

const filesRootDir = "./files/todos_2025/30-07/"; // Directorio de archivos
const leadsFileName = "leads_interesados.csv"; // Nombre del archivo de leads
const phonesColName = "Teléfono"; // Nombre de la columna de teléfonos
const countriesColName = "País"; // Nombre de la columna de países
const locationColName = "Ubicación"; // Nombre de la columna de ubicación
const formattedPhonesColName = "Teléfono Formateado"; // Nombre de la columna de teléfonos formateados
const diploColName = "Ultima Cursando"; // Nombre de la columna de diplomado
const validatedFileName = "leads_validos.csv";
const invalidFileName = "leads_invalidos.csv";

// Lee el archivo CSV
const csvData = fs.readFileSync(filesRootDir + leadsFileName, "utf8");

// Configura las opciones de parseo de CSV
const records = parse(csvData, {
  columns: true, // Asume que la primera fila contiene los nombres de las columnas
  skip_empty_lines: true,
  delimiter: ";",
});

// Lee el archivo JSON de forma sincrónica
const phonesJson = fs.readFileSync("phones_final.json", "utf8");
const phonesData = JSON.parse(phonesJson);

let correctPhones = [];
let incorrectPhones = [];

// Itera sobre los registros del CSV
for (const record of records) {
  const phoneNumber = record[phonesColName]; //Phone number
  let country = record[countriesColName]; //Country
  const location = record[locationColName]; //Location

  if (!country && location) {
    country = location;
  }

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
      if (
        countryIso === "AR" &&
        formattedNumber.startsWith("+54") &&
        !formattedNumber.startsWith("+549")
      ) {
        formattedNumber = formattedNumber.replace("+54", "+549");
      } else if (
        countryIso === "MX" &&
        formattedNumber.startsWith("+52") &&
        !formattedNumber.startsWith("+521")
      ) {
        formattedNumber = formattedNumber.replace("+52", "+521");
      }

      record[formattedPhonesColName] = formattedNumber;

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
fs.writeFileSync(filesRootDir + validatedFileName, validCsvString);

// Escribir los registros inválidos en un archivo CSV
const invalidCsvString = stringify(incorrectPhones, { header: true });
fs.writeFileSync(filesRootDir + invalidFileName, invalidCsvString);
