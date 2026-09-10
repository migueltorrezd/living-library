// A fixed origin serves the author's unmodified, freely offered PDF to the
// browser viewer. It is fetched on demand; no mirrored book is stored here.
const SOURCE='https://navalmanack.s3.amazonaws.com/Eric-Jorgenson_The-Almanack-of-Naval-Ravikant_Final.pdf';
export async function GET(request:Request){
 const range=request.headers.get('range');
 if(range&&!/^bytes=\d+-\d*$/.test(range))return new Response('Invalid range',{status:416});
 try{
  const upstream=await fetch(SOURCE,{headers:range?{Range:range}:{},cache:'no-store',signal:request.signal});
  if(!upstream.ok)return new Response('The official edition is temporarily unavailable.',{status:502});
  const headers=new Headers({'Content-Type':'application/pdf','Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff'});
  for(const name of ['content-length','content-range','accept-ranges','etag']){const value=upstream.headers.get(name);if(value)headers.set(name,value);}
  return new Response(upstream.body,{status:upstream.status,headers});
 }catch{return new Response('The official edition could not be reached.',{status:502});}
}
