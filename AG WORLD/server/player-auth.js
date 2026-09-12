/* The API is a shared Company world. Writes require an enrolled, verified player. */
const PROJECT='https://vcnkspaljmsjvonftfcw.supabase.co';
const PUBLIC_KEY='sb_publishable_azAO3PoKko79ccwSJFjkhQ_L67ZM85o';
export function playerAuthorization(pool,fetcher=fetch){
 return async(req,res,next)=>{
  if(req.method==='OPTIONS'||(req.method==='GET'&&!req.path.startsWith('/users/')))return next();
  // The old acceptance endpoint writes test records into the world. It is not a player feature.
  if(req.path.endsWith('/acceptance-test'))return res.status(404).json({error:'Not found'});
  const authorization=req.get('authorization')||'';
  if(!/^Bearer [^ ]+$/.test(authorization))return res.status(401).json({error:'Sign in to update the Company world.'});
  try{
   const result=await fetcher(PROJECT+'/auth/v1/user',{headers:{apikey:PUBLIC_KEY,Authorization:authorization},signal:AbortSignal.timeout(10000)});
   if(!result.ok)return res.status(401).json({error:'Your session could not be verified. Please sign in again.'});
   const user=await result.json();if(!user?.id)return res.status(401).json({error:'Invalid session.'});
   const enrolled=await pool.query('select id from ag_players where id=$1',[user.id]);
   if(!enrolled.rows.length)return res.status(403).json({error:'A Company player profile is required.'});
   if(req.path.startsWith('/users/')&&decodeURIComponent(req.path.split('/')[2])!==user.id)return res.status(403).json({error:'You can only access your own profile.'});
   req.playerId=user.id;req.headers['x-actor-id']=user.id;return next();
  }catch(_){return res.status(503).json({error:'Account verification is unavailable. Please retry.'});}
 };
}
