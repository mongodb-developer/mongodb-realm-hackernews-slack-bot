exports = async function(changeEvent) {
  const jobs = context.services.get("mongodb-atlas").db("bot").collection("jobs");
  const items = context.services.get("mongodb-atlas").db("bot").collection("max_items");
  
  const fullDocument = changeEvent.fullDocument;
  const new_max_item = fullDocument._id;
  console.log('Current max item:  ' + new_max_item);
  
  const previous_doc_array = await items.find({'_id': {'$lt': new_max_item}}, {'_id': 1})
    .sort({'_id': -1})
    .limit(1)
    .toArray();
    
  if (previous_doc_array.length == 0) {
    const msg = "Can't find previous max item document because it's the first entry. Ignoring.";
    console.log(msg);
    return msg;
  }
  
  const previous_max_item = previous_doc_array[0]._id;
  console.log("Previous max item: " + previous_max_item);
  
  let first_item = previous_max_item + 1;
  let last_item = 0;
  let jobs_array = [];
  
  while (last_item != new_max_item) {
    last_item = Math.min(first_item + 29, new_max_item);
    console.log('=> Job: ' + first_item + ' => ' + last_item);
    jobs_array.push({'first_item': first_item, 'last_item': last_item, 'items': (last_item - first_item + 1),'created_at': new Date(), 'status': 'new'});
    first_item = last_item + 1;
  }
  
  jobs.insertMany(jobs_array)
    .then(res => console.log(`Successfully inserted ${res.insertedIds.length} new jobs!`))
    .catch(err => console.error(`Failed to insert new jobs: ${err}`));
  
  return "Job done!";
};
