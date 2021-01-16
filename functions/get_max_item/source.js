exports = function(){
  const coll = context.services.get("mongodb-atlas").db("bot").collection("max_items");
  context.http
    .get({ url: "https://hacker-news.firebaseio.com/v0/maxitem.json"})
    .then(resp => {
      const max_item = EJSON.parse(resp.body.text());
      let body = {'_id': max_item, 'inserted_at': new Date()};
      coll.insertOne(body)
        .then(res => console.log(`New max item inserted: ${max_item}`))
        .catch(err => console.error(`Failed to insert new max item: ${err}`));
    }).catch(err => console.error(`Failed to retrieve max item from HN API: ${err}`));
  return "Job done!";
};