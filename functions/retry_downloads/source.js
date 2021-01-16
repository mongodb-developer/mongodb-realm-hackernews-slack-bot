exports = async function(){
  const jobs = context.services.get("mongodb-atlas").db("bot").collection("jobs");
  
  await jobs.updateMany({"status": "processing", "retry_null_items": true, "retried": {"$gte": 5}}, {"$set": {"retry_null_items": false} })
    .then(result => {
      const { matchedCount, modifiedCount } = result;
      console.log(`Successfully matched ${matchedCount} jobs and modified ${modifiedCount} jobs to disable the retry on null items.`);
    }).catch(err => console.error(`Failed to update the jobs to disable the retry on null items: ${err}`));
  
  await jobs.updateMany({"status": "processing", "created_at": {"$lt": new Date(new Date().getTime() - 1000 * 60 * 15)}}, {"$set": {"status": "retrying"}, "$inc": {"retried": 1}})
    .then(result => {
      const { matchedCount, modifiedCount } = result;
      console.log(`Successfully matched ${matchedCount} jobs and modified ${modifiedCount} jobs to trigger the retry download.`);
    }).catch(err => console.error(`Failed to update the jobs to trigger the retry download: ${err}`));
    
  return "Job done!";
};