function linkItem(id) {
  return `https://news.ycombinator.com/item?id=${id}`;
}

function linkUser(id) {
  return `https://news.ycombinator.com/user?id=${id}`;
}

exports = async function(changeEvent) {
  const doc = changeEvent.fullDocument;
  const url = context.values.get("url_slack_realm");
  let msg = "";
  
  if (doc.type === "comment") {
    msg += `*Comment* by <${linkUser(doc.by)}|${doc.by}> | <${linkItem(doc._id)}|comment> | <${linkItem(doc.parent)}|parent>.\n`;
    msg += await context.functions.execute("html2md", doc.text.replace(/<p>/g, "\n<p>"));
  } else if (doc.type === "story") {
    msg += `*Story*: <${doc.url}|${doc.title}> by <${linkUser(doc.by)}|${doc.by}> | <${linkItem(doc._id)}|story>.`;
  } else if (doc.type === "job") {
    msg += `*Job*: <${doc.url}|${doc.title}> by <${linkUser(doc.by)}|${doc.by}> | <${linkItem(doc._id)}|job>.`;
  } else {
    console.log("Title: " + doc.title);
    console.log("Text : " + doc.text);
    return "Ignoring this message.";
  }
  
  await context.http.post({
    "url": url,
    "body": {"text": msg},
    "encodeBodyAsJSON": true
  });
  
  return "Job Done!";
};
