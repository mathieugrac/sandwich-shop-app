drop extension if exists "pg_net";

drop trigger if exists "update_clients_updated_at" on "public"."clients";

drop trigger if exists "update_drop_products_updated_at" on "public"."drop_products";

drop trigger if exists "update_drops_updated_at" on "public"."drops";

drop trigger if exists "update_locations_updated_at" on "public"."locations";

drop trigger if exists "set_order_number_trigger" on "public"."orders";

drop trigger if exists "update_orders_updated_at" on "public"."orders";

drop trigger if exists "update_products_updated_at" on "public"."products";

drop policy "Clients are manageable by authenticated users" on "public"."clients";

drop policy "Drop products are deletable by authenticated users" on "public"."drop_products";

drop policy "Drop products are insertable by authenticated users" on "public"."drop_products";

drop policy "Drop products are updatable by authenticated users" on "public"."drop_products";

drop policy "Drop products are viewable by everyone" on "public"."drop_products";

drop policy "Drops are deletable by authenticated users" on "public"."drops";

drop policy "Drops are insertable by authenticated users" on "public"."drops";

drop policy "Drops are updatable by authenticated users" on "public"."drops";

drop policy "Drops are viewable by everyone" on "public"."drops";

drop policy "Locations are deletable by authenticated users" on "public"."locations";

drop policy "Locations are insertable by authenticated users" on "public"."locations";

drop policy "Locations are updatable by authenticated users" on "public"."locations";

drop policy "Locations are viewable by everyone" on "public"."locations";

drop policy "Order items are deletable by authenticated users" on "public"."order_items";

drop policy "Order items are insertable by everyone" on "public"."order_items";

drop policy "Order items are updatable by authenticated users" on "public"."order_items";

drop policy "Order items are viewable by everyone" on "public"."order_items";

drop policy "Order products are deletable by authenticated users" on "public"."order_products";

drop policy "Order products are insertable by everyone" on "public"."order_products";

drop policy "Order products are updatable by authenticated users" on "public"."order_products";

drop policy "Order products are viewable by everyone" on "public"."order_products";

drop policy "Orders are deletable by authenticated users" on "public"."orders";

drop policy "Orders are insertable by everyone" on "public"."orders";

drop policy "Orders are updatable by authenticated users" on "public"."orders";

drop policy "Orders are viewable by everyone" on "public"."orders";

drop policy "Product images are deletable by authenticated users" on "public"."product_images";

drop policy "Product images are insertable by authenticated users" on "public"."product_images";

drop policy "Product images are updatable by authenticated users" on "public"."product_images";

drop policy "Product images are viewable by everyone" on "public"."product_images";

drop policy "Products are deletable by authenticated users" on "public"."products";

drop policy "Products are insertable by authenticated users" on "public"."products";

drop policy "Products are updatable by authenticated users" on "public"."products";

drop policy "Products are viewable by everyone" on "public"."products";

revoke delete on table "public"."admin_users" from "anon";

revoke insert on table "public"."admin_users" from "anon";

revoke references on table "public"."admin_users" from "anon";

revoke select on table "public"."admin_users" from "anon";

revoke trigger on table "public"."admin_users" from "anon";

revoke truncate on table "public"."admin_users" from "anon";

revoke update on table "public"."admin_users" from "anon";

revoke delete on table "public"."admin_users" from "authenticated";

revoke insert on table "public"."admin_users" from "authenticated";

revoke references on table "public"."admin_users" from "authenticated";

revoke select on table "public"."admin_users" from "authenticated";

revoke trigger on table "public"."admin_users" from "authenticated";

revoke truncate on table "public"."admin_users" from "authenticated";

revoke update on table "public"."admin_users" from "authenticated";

revoke delete on table "public"."admin_users" from "service_role";

revoke insert on table "public"."admin_users" from "service_role";

revoke references on table "public"."admin_users" from "service_role";

revoke select on table "public"."admin_users" from "service_role";

revoke trigger on table "public"."admin_users" from "service_role";

revoke truncate on table "public"."admin_users" from "service_role";

revoke update on table "public"."admin_users" from "service_role";

revoke delete on table "public"."clients" from "anon";

revoke insert on table "public"."clients" from "anon";

revoke references on table "public"."clients" from "anon";

revoke select on table "public"."clients" from "anon";

revoke trigger on table "public"."clients" from "anon";

revoke truncate on table "public"."clients" from "anon";

revoke update on table "public"."clients" from "anon";

revoke delete on table "public"."clients" from "authenticated";

revoke insert on table "public"."clients" from "authenticated";

revoke references on table "public"."clients" from "authenticated";

revoke select on table "public"."clients" from "authenticated";

revoke trigger on table "public"."clients" from "authenticated";

revoke truncate on table "public"."clients" from "authenticated";

revoke update on table "public"."clients" from "authenticated";

revoke delete on table "public"."clients" from "service_role";

revoke insert on table "public"."clients" from "service_role";

revoke references on table "public"."clients" from "service_role";

revoke select on table "public"."clients" from "service_role";

revoke trigger on table "public"."clients" from "service_role";

revoke truncate on table "public"."clients" from "service_role";

revoke update on table "public"."clients" from "service_role";

revoke delete on table "public"."drop_products" from "anon";

revoke insert on table "public"."drop_products" from "anon";

revoke references on table "public"."drop_products" from "anon";

revoke select on table "public"."drop_products" from "anon";

revoke trigger on table "public"."drop_products" from "anon";

revoke truncate on table "public"."drop_products" from "anon";

revoke update on table "public"."drop_products" from "anon";

revoke delete on table "public"."drop_products" from "authenticated";

revoke insert on table "public"."drop_products" from "authenticated";

revoke references on table "public"."drop_products" from "authenticated";

revoke select on table "public"."drop_products" from "authenticated";

revoke trigger on table "public"."drop_products" from "authenticated";

revoke truncate on table "public"."drop_products" from "authenticated";

revoke update on table "public"."drop_products" from "authenticated";

revoke delete on table "public"."drop_products" from "service_role";

revoke insert on table "public"."drop_products" from "service_role";

revoke references on table "public"."drop_products" from "service_role";

revoke select on table "public"."drop_products" from "service_role";

revoke trigger on table "public"."drop_products" from "service_role";

revoke truncate on table "public"."drop_products" from "service_role";

revoke update on table "public"."drop_products" from "service_role";

revoke delete on table "public"."drops" from "anon";

revoke insert on table "public"."drops" from "anon";

revoke references on table "public"."drops" from "anon";

revoke select on table "public"."drops" from "anon";

revoke trigger on table "public"."drops" from "anon";

revoke truncate on table "public"."drops" from "anon";

revoke update on table "public"."drops" from "anon";

revoke delete on table "public"."drops" from "authenticated";

revoke insert on table "public"."drops" from "authenticated";

revoke references on table "public"."drops" from "authenticated";

revoke select on table "public"."drops" from "authenticated";

revoke trigger on table "public"."drops" from "authenticated";

revoke truncate on table "public"."drops" from "authenticated";

revoke update on table "public"."drops" from "authenticated";

revoke delete on table "public"."drops" from "service_role";

revoke insert on table "public"."drops" from "service_role";

revoke references on table "public"."drops" from "service_role";

revoke select on table "public"."drops" from "service_role";

revoke trigger on table "public"."drops" from "service_role";

revoke truncate on table "public"."drops" from "service_role";

revoke update on table "public"."drops" from "service_role";

revoke delete on table "public"."locations" from "anon";

revoke insert on table "public"."locations" from "anon";

revoke references on table "public"."locations" from "anon";

revoke select on table "public"."locations" from "anon";

revoke trigger on table "public"."locations" from "anon";

revoke truncate on table "public"."locations" from "anon";

revoke update on table "public"."locations" from "anon";

revoke delete on table "public"."locations" from "authenticated";

revoke insert on table "public"."locations" from "authenticated";

revoke references on table "public"."locations" from "authenticated";

revoke select on table "public"."locations" from "authenticated";

revoke trigger on table "public"."locations" from "authenticated";

revoke truncate on table "public"."locations" from "authenticated";

revoke update on table "public"."locations" from "authenticated";

revoke delete on table "public"."locations" from "service_role";

revoke insert on table "public"."locations" from "service_role";

revoke references on table "public"."locations" from "service_role";

revoke select on table "public"."locations" from "service_role";

revoke trigger on table "public"."locations" from "service_role";

revoke truncate on table "public"."locations" from "service_role";

revoke update on table "public"."locations" from "service_role";

revoke delete on table "public"."order_items" from "anon";

revoke insert on table "public"."order_items" from "anon";

revoke references on table "public"."order_items" from "anon";

revoke select on table "public"."order_items" from "anon";

revoke trigger on table "public"."order_items" from "anon";

revoke truncate on table "public"."order_items" from "anon";

revoke update on table "public"."order_items" from "anon";

revoke delete on table "public"."order_items" from "authenticated";

revoke insert on table "public"."order_items" from "authenticated";

revoke references on table "public"."order_items" from "authenticated";

revoke select on table "public"."order_items" from "authenticated";

revoke trigger on table "public"."order_items" from "authenticated";

revoke truncate on table "public"."order_items" from "authenticated";

revoke update on table "public"."order_items" from "authenticated";

revoke delete on table "public"."order_items" from "service_role";

revoke insert on table "public"."order_items" from "service_role";

revoke references on table "public"."order_items" from "service_role";

revoke select on table "public"."order_items" from "service_role";

revoke trigger on table "public"."order_items" from "service_role";

revoke truncate on table "public"."order_items" from "service_role";

revoke update on table "public"."order_items" from "service_role";

revoke delete on table "public"."order_products" from "anon";

revoke insert on table "public"."order_products" from "anon";

revoke references on table "public"."order_products" from "anon";

revoke select on table "public"."order_products" from "anon";

revoke trigger on table "public"."order_products" from "anon";

revoke truncate on table "public"."order_products" from "anon";

revoke update on table "public"."order_products" from "anon";

revoke delete on table "public"."order_products" from "authenticated";

revoke insert on table "public"."order_products" from "authenticated";

revoke references on table "public"."order_products" from "authenticated";

revoke select on table "public"."order_products" from "authenticated";

revoke trigger on table "public"."order_products" from "authenticated";

revoke truncate on table "public"."order_products" from "authenticated";

revoke update on table "public"."order_products" from "authenticated";

revoke delete on table "public"."order_products" from "service_role";

revoke insert on table "public"."order_products" from "service_role";

revoke references on table "public"."order_products" from "service_role";

revoke select on table "public"."order_products" from "service_role";

revoke trigger on table "public"."order_products" from "service_role";

revoke truncate on table "public"."order_products" from "service_role";

revoke update on table "public"."order_products" from "service_role";

revoke delete on table "public"."orders" from "anon";

revoke insert on table "public"."orders" from "anon";

revoke references on table "public"."orders" from "anon";

revoke select on table "public"."orders" from "anon";

revoke trigger on table "public"."orders" from "anon";

revoke truncate on table "public"."orders" from "anon";

revoke update on table "public"."orders" from "anon";

revoke delete on table "public"."orders" from "authenticated";

revoke insert on table "public"."orders" from "authenticated";

revoke references on table "public"."orders" from "authenticated";

revoke select on table "public"."orders" from "authenticated";

revoke trigger on table "public"."orders" from "authenticated";

revoke truncate on table "public"."orders" from "authenticated";

revoke update on table "public"."orders" from "authenticated";

revoke delete on table "public"."orders" from "service_role";

revoke insert on table "public"."orders" from "service_role";

revoke references on table "public"."orders" from "service_role";

revoke select on table "public"."orders" from "service_role";

revoke trigger on table "public"."orders" from "service_role";

revoke truncate on table "public"."orders" from "service_role";

revoke update on table "public"."orders" from "service_role";

revoke delete on table "public"."product_images" from "anon";

revoke insert on table "public"."product_images" from "anon";

revoke references on table "public"."product_images" from "anon";

revoke select on table "public"."product_images" from "anon";

revoke trigger on table "public"."product_images" from "anon";

revoke truncate on table "public"."product_images" from "anon";

revoke update on table "public"."product_images" from "anon";

revoke delete on table "public"."product_images" from "authenticated";

revoke insert on table "public"."product_images" from "authenticated";

revoke references on table "public"."product_images" from "authenticated";

revoke select on table "public"."product_images" from "authenticated";

revoke trigger on table "public"."product_images" from "authenticated";

revoke truncate on table "public"."product_images" from "authenticated";

revoke update on table "public"."product_images" from "authenticated";

revoke delete on table "public"."product_images" from "service_role";

revoke insert on table "public"."product_images" from "service_role";

revoke references on table "public"."product_images" from "service_role";

revoke select on table "public"."product_images" from "service_role";

revoke trigger on table "public"."product_images" from "service_role";

revoke truncate on table "public"."product_images" from "service_role";

revoke update on table "public"."product_images" from "service_role";

revoke delete on table "public"."products" from "anon";

revoke insert on table "public"."products" from "anon";

revoke references on table "public"."products" from "anon";

revoke select on table "public"."products" from "anon";

revoke trigger on table "public"."products" from "anon";

revoke truncate on table "public"."products" from "anon";

revoke update on table "public"."products" from "anon";

revoke delete on table "public"."products" from "authenticated";

revoke insert on table "public"."products" from "authenticated";

revoke references on table "public"."products" from "authenticated";

revoke select on table "public"."products" from "authenticated";

revoke trigger on table "public"."products" from "authenticated";

revoke truncate on table "public"."products" from "authenticated";

revoke update on table "public"."products" from "authenticated";

revoke delete on table "public"."products" from "service_role";

revoke insert on table "public"."products" from "service_role";

revoke references on table "public"."products" from "service_role";

revoke select on table "public"."products" from "service_role";

revoke trigger on table "public"."products" from "service_role";

revoke truncate on table "public"."products" from "service_role";

revoke update on table "public"."products" from "service_role";

alter table "public"."order_items" drop constraint "order_items_order_id_fkey";

alter table "public"."order_items" drop constraint "order_items_product_id_fkey";

alter table "public"."order_items" drop constraint "order_items_quantity_check";

alter table "public"."orders" drop constraint "orders_order_number_unique";

alter table "public"."drops" drop constraint "drops_status_check";

alter table "public"."orders" drop constraint "orders_drop_id_fkey";

alter table "public"."products" drop constraint "products_category_check";

drop function if exists "public"."check_inventory_availability"(p_drop_id uuid, p_product_id uuid, p_requested_quantity integer);

drop function if exists "public"."release_inventory"(p_drop_id uuid, p_product_id uuid, p_quantity integer);

drop function if exists "public"."reserve_inventory"(p_drop_id uuid, p_product_id uuid, p_quantity integer);

drop function if exists "public"."set_order_number"();

drop function if exists "public"."update_updated_at_column"();

drop function if exists "public"."get_admin_past_drops"();

drop function if exists "public"."get_admin_upcoming_drops"();

alter table "public"."order_items" drop constraint "order_items_pkey";

drop index if exists "public"."idx_admin_users_email";

drop index if exists "public"."idx_clients_email";

drop index if exists "public"."idx_drops_date";

drop index if exists "public"."idx_drops_status";

drop index if exists "public"."idx_orders_created_at";

drop index if exists "public"."idx_orders_order_number";

drop index if exists "public"."idx_product_images_product_id";

drop index if exists "public"."idx_product_images_sort_order";

drop index if exists "public"."idx_products_sort_order";

drop index if exists "public"."order_items_pkey";

drop index if exists "public"."orders_order_number_unique";

drop table "public"."order_items";

alter table "public"."drop_products" alter column "selling_price" drop default;

alter table "public"."orders" drop column "customer_email";

alter table "public"."orders" drop column "customer_phone";

alter table "public"."orders" drop column "special_requests";

alter table "public"."orders" drop column "stripe_payment_intent_id";

alter table "public"."orders" alter column "order_date" drop default;

alter table "public"."products" alter column "production_cost" set default 0.00;

CREATE INDEX idx_drops_status_changed_at ON public.drops USING btree (status_changed_at);

alter table "public"."locations" add constraint "check_pickup_hours" CHECK ((((pickup_hour_start = '00:00:00'::time without time zone) AND (pickup_hour_end = '00:00:00'::time without time zone)) OR (pickup_hour_end > pickup_hour_start))) not valid;

alter table "public"."locations" validate constraint "check_pickup_hours";

alter table "public"."drops" add constraint "drops_status_check" CHECK (((status)::text = ANY (ARRAY[('upcoming'::character varying)::text, ('active'::character varying)::text, ('completed'::character varying)::text, ('cancelled'::character varying)::text]))) not valid;

alter table "public"."drops" validate constraint "drops_status_check";

alter table "public"."orders" add constraint "orders_drop_id_fkey" FOREIGN KEY (drop_id) REFERENCES drops(id) ON DELETE CASCADE not valid;

alter table "public"."orders" validate constraint "orders_drop_id_fkey";

alter table "public"."products" add constraint "products_category_check" CHECK (((category)::text = ANY (ARRAY[('sandwich'::character varying)::text, ('side'::character varying)::text, ('dessert'::character varying)::text, ('beverage'::character varying)::text]))) not valid;

alter table "public"."products" validate constraint "products_category_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_multiple_drop_products_availability(p_order_items jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  item JSONB;
  available_qty INTEGER;
BEGIN
  -- Check if all items are available
  FOR item IN SELECT value FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT available_quantity INTO available_qty
    FROM drop_products
    WHERE id = (item->>'drop_product_id')::UUID;

    -- If any item doesn't have enough stock, return false
    IF available_qty < (item->>'order_quantity')::INTEGER THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  -- All items are available
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_order_number()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_past_drops()
 RETURNS TABLE(id uuid, date date, status character varying, location_id uuid, location_name character varying, status_changed_at timestamp with time zone, total_available bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.date, 
    d.status, 
    d.location_id, 
    l.name as location_name, 
    d.status_changed_at,
    COALESCE(SUM(dp.available_quantity), 0) as total_available
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  WHERE d.status IN ('completed', 'cancelled')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name, d.status_changed_at
  ORDER BY d.date DESC, d.status ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_admin_upcoming_drops()
 RETURNS TABLE(id uuid, date date, status character varying, location_id uuid, location_name character varying, status_changed_at timestamp with time zone, total_available bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    d.id, 
    d.date, 
    d.status, 
    d.location_id, 
    l.name as location_name, 
    d.status_changed_at,
    COALESCE(SUM(dp.available_quantity), 0) as total_available
  FROM drops d
  JOIN locations l ON d.location_id = l.id
  LEFT JOIN drop_products dp ON d.id = dp.drop_id
  WHERE d.status IN ('upcoming', 'active')
  GROUP BY d.id, d.date, d.status, d.location_id, l.name, d.status_changed_at
  ORDER BY d.date ASC, d.status ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_client(p_email text, p_phone text)
 RETURNS uuid
 LANGUAGE plpgsql
AS $function$
DECLARE
  client_id UUID;
BEGIN
  SELECT id INTO client_id
  FROM clients
  WHERE email = p_email;
  
  IF client_id IS NOT NULL THEN
    UPDATE clients 
    SET phone = COALESCE(p_phone, phone),
        updated_at = NOW()
    WHERE id = client_id;
    RETURN client_id;
  ELSE
    INSERT INTO clients (email, phone)
    VALUES (p_email, p_phone)
    RETURNING id INTO client_id;
    RETURN client_id;
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.release_multiple_drop_products(p_order_items jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
DECLARE
  item RECORD;
BEGIN
  -- Release reserved quantities for all items
  FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    UPDATE drop_products
    SET reserved_quantity = GREATEST(0, reserved_quantity - (item->>'order_quantity')::INTEGER),
        updated_at = NOW()
    WHERE id = (item->>'drop_product_id')::UUID;
  END LOOP;
  
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.reserve_multiple_drop_products(p_order_items jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  item JSONB;
  available_qty INTEGER;
  can_reserve BOOLEAN := TRUE;
BEGIN
  -- First check if all items can be reserved
  FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT available_quantity INTO available_qty
    FROM drop_products
    WHERE id = (item->>'drop_product_id')::UUID;
    
    IF available_qty < (item->>'order_quantity')::INTEGER THEN
      can_reserve := FALSE;
      EXIT;
    END IF;
  END LOOP;
  
  -- If all can be reserved, reserve them
  IF can_reserve THEN
    FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
    LOOP
      UPDATE drop_products
      SET reserved_quantity = reserved_quantity + (item->>'order_quantity')::INTEGER,
          updated_at = NOW()
      WHERE id = (item->>'drop_product_id')::UUID;
    END LOOP;
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$function$
;


  create policy "Admin can manage drop products"
  on "public"."drop_products"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Public can view drop products"
  on "public"."drop_products"
  as permissive
  for select
  to public
using (true);



  create policy "Admin can manage drops"
  on "public"."drops"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Public can view active drops"
  on "public"."drops"
  as permissive
  for select
  to public
using (((status)::text = 'active'::text));



  create policy "Admin can manage locations"
  on "public"."locations"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Public can view active locations"
  on "public"."locations"
  as permissive
  for select
  to public
using ((active = true));



  create policy "Admin can manage orders"
  on "public"."orders"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Anyone can create orders"
  on "public"."orders"
  as permissive
  for insert
  to public
with check (true);



  create policy "Admin can manage product images"
  on "public"."product_images"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Public can view product images"
  on "public"."product_images"
  as permissive
  for select
  to public
using (true);



  create policy "Admin can manage products"
  on "public"."products"
  as permissive
  for all
  to public
using ((auth.role() = 'authenticated'::text));



  create policy "Public can view active products"
  on "public"."products"
  as permissive
  for select
  to public
using ((active = true));



