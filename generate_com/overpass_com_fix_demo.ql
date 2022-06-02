[out:json][timeout:25];

rel(id:6063063);
map_to_area->.a;
(
  way["natural"="coastline"](area.a);
  relation["natural"="coastline"](area.a);
);
// print results
out body; >; out skel qt;
