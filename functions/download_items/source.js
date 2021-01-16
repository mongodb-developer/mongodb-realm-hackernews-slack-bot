async function get_item(id, retry = true) {
  let resp = await context.http.get({ url: `https://hacker-news.firebaseio.com/v0/item/${id}.json`});
  let item = EJSON.parse(resp.body.text());
  if (item === null && retry === false) {
    return null;
  }
  while (item === null) {
    console.log("Waiting 2 seconds because Firebase returned null for ID " + id + " at " + new Date());
    await new Promise(r => setTimeout(r, 2000)); // waiting 2 secs so firebase has a chance to catch up.
    item = await get_item(id, retry);
  }
  return item;
}

exports = async function(changeEvent) {
  const jobs = context.services.get("mongodb-atlas").db("bot").collection("jobs");
  const items = context.services.get("mongodb-atlas").db("hn").collection("items");
  
  const docId = changeEvent.documentKey._id;
  const fullDocument = changeEvent.fullDocument;
  const first = fullDocument.first_item;
  const last = fullDocument.last_item;
  const items_count = fullDocument.items;
  const retry = fullDocument.retry_null_items;
  
  console.log(`Starting to import ${last - first + 1} items ${first} => ${last}`);
  
  jobs.updateOne({'_id': docId},{'$set': {'status': 'processing'}})
    .then(res => console.log(`Job ${docId} is processing.`))
    .catch(err => console.error(`Failed to update job ${docId} to 'processing'.`));
  
  let items_array = [];

  for (let id = first; id <= last; id++) {
    try {
      let item = await get_item(id, retry);
      if (item === null && retry === false) {
        continue;
      }
      item._id = item.id;
      delete item.id;
      item.inserted_at = new Date();
      item.time_iso = new Date(item.time * 1000);
      delete item.time;
      items_array.push(item);
    } catch (err) {
      console.error(`Failed to retrieve item ${id} from HN API: ${err}`);
    }
  }

  let inserted = -1;
  try {
    const res = await items.insertMany(items_array);
    inserted = res.insertedIds.length;
    console.log(`Successfully inserted ${inserted} new items!`);
  } catch (err) {
    console.error(`Failed to insert new items: ${err}`);
  }
  
  const status = inserted === items_count ? 'done' : 'error';
  
  jobs.updateOne({'_id': docId},{'$set': {'status': status, 'inserted': inserted}})
    .then(res => console.log(`Job ${docId} is done.`))
    .catch(err => console.error(`Failed to update job ${docId} to 'done'.`));

  return "Job done!";
};
