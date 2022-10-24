[out:json][timeout:25];
(
  // query part for: “"ref:INSEE"=*”
  node["ref:INSEE"]["admin_level"="8"](if: is_number(t["ref:INSEE"]) && number(t["ref:INSEE"])>=97700 );
  way["ref:INSEE"]["admin_level"="8"](if: is_number(t["ref:INSEE"]) && number(t["ref:INSEE"])>=97700 );
  relation["ref:INSEE"]["admin_level"="8"](if: is_number(t["ref:INSEE"]) && number(t["ref:INSEE"])>=97700 );
  node["ref:INSEE"]["ref:INSEE"~"^975"];
  way["ref:INSEE"]["ref:INSEE"~"^975"];
  relation["ref:INSEE"]["ref:INSEE"~"^975"];
);
// print results
out body;
>;
out skel qt;
