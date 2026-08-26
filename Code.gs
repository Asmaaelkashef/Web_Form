/**
 * Code.gs
 * Google Apps Script backend for the Baccalaureate booking form.
 */

// Name of the sheet (tab) inside the spreadsheet where bookings are stored.
const SHEET_NAME = "Bookings";

// The exact column order written to the sheet.
const COLUMNS = [
  "Timestamp",
  "Student Name",
  "Grade",
  "Appointment",
  "Phone",
  "Notes"
];

/**
 * Handles POST requests sent from the website's fetch() call.
 */
function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({
        status: "error",
        message: "No data received."
      });
    }

    const data = JSON.parse(e.postData.contents);

    const validationError = validateBookingData(data);

    if (validationError) {
      return jsonResponse({
        status: "error",
        message: validationError
      });
    }

    const sheet = getOrCreateSheet();

    sheet.appendRow([
      new Date(),
      data.studentName,
      data.grade,
      data.appointment,
      data.phone,
      data.notes || "",
    ]);

    return jsonResponse({
      status: "success",
      message: "تم تسجيل الحجز بنجاح."
    });

  } catch (err) {
    return jsonResponse({
      status: "error",
      message: "Server error: " + err.message
    });
  }
}

/**
 * Optional: lets you open the Web App URL directly in a browser
 * to confirm it is deployed correctly.
 */
function doGet() {
  return jsonResponse({
    status: "success",
    message: "Booking API is running."
  });
}

/**
 * Basic server-side validation.
 */
function validateBookingData(data) {

  if (!data.studentName || data.studentName.trim().length < 3) {
    return "اسم الطالب غير صحيح.";
  }

  if (!data.grade) {
    return "الصف الدراسي مطلوب.";
  }

  if (!data.appointment) {
    return "موعد الشرح مطلوب.";
  }

  if (!data.phone || data.phone.trim().length < 8) {
    return "رقم الهاتف غير صحيح.";
  }

  return null;
}

/**
 * Returns the "Bookings" sheet,
 * creating it with a header row if it does not exist yet.
 */
function getOrCreateSheet() {

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {

    sheet = spreadsheet.insertSheet(SHEET_NAME);

    sheet.appendRow(COLUMNS);

    sheet
      .getRange(1, 1, 1, COLUMNS.length)
      .setFontWeight("bold");

    sheet.setFrozenRows(1);
  }

  return sheet;
}

/**
 * Wraps a JS object as a JSON ContentService response.
 */
function jsonResponse(obj) {

  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);

}