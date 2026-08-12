var ROOT_FOLDER_ID = '1oLUH3q8uiYLsP7ECp8xfV2uUHMQAVH8m';

// アップロード完了通知を送るメールアドレス（3つ）
var NOTIFY_EMAILS = [
  'arai@beautypro.co.jp',
  'arai.tomoya@beautypro.co.jp',
  'job@beautypro.co.jp'
];

function doGet(e) {
  var page = e.parameter.page;
  var caseId = e.parameter.caseId;

  if (page === 'admin') {
    return HtmlService.createHtmlOutputFromFile('admin')
      .setTitle('案件管理')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  var template = HtmlService.createTemplateFromFile('index');
  template.caseId = caseId || '';
  template.caseName = '';

  if (caseId) {
    try {
      var folder = DriveApp.getFolderById(caseId);
      template.caseName = folder.getName();
    } catch (err) {
      template.caseName = '';
    }
  }

  return template.evaluate()
    .setTitle('写真アップロード')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function uploadFile(base64Data, fileName, mimeType, caseId) {
  var folder;
  if (caseId) {
    try {
      folder = DriveApp.getFolderById(caseId);
    } catch (err) {
      folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    }
  } else {
    folder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  }

  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType, fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  return file.getUrl();
}

function createCase(caseName) {
  var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  var newFolder = rootFolder.createFolder(caseName);

  return {
    id: newFolder.getId(),
    name: newFolder.getName(),
    url: newFolder.getUrl(),
    created: newFolder.getDateCreated().getTime()
  };
}

function getCases() {
  var rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
  var folders = rootFolder.getFolders();
  var cases = [];

  while (folders.hasNext()) {
    var folder = folders.next();
    cases.push({
      id: folder.getId(),
      name: folder.getName(),
      url: folder.getUrl(),
      created: folder.getDateCreated().getTime()
    });
  }

  cases.sort(function(a, b) { return b.created - a.created; });
  return cases;
}

function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

function renameCase(folderId, newName) {
  var folder = DriveApp.getFolderById(folderId);
  folder.setName(newName);
  return { id: folderId, name: newName };
}

function sendNotification(caseName, fileCount) {
  var name = caseName || '案件';
  var subject = '【写真受信】' + name + ' に写真が届きました';
  var body = name + ' に ' + fileCount + '枚の写真がアップロードされました。\n\nGoogle Driveで確認してください。';
  NOTIFY_EMAILS.forEach(function(email) {
    MailApp.sendEmail(email, subject, body);
  });
}
