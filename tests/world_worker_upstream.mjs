export default {fetch(request) {
  if (request.redirect !== 'manual') throw new Error('redirect mode must be manual');
  return Response.json({esquema:'preceptoros.openworld-estado/2',colonia:{nodes:[],buildings:[],units:[]}});
}};
