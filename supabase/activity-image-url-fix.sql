update public.activities
set image_url = '/images/activities/cathedral.jpg'
where title = 'Guided Cathedral Visit'
  and (image_url is null or trim(image_url) = '');

update public.activities
set image_url = '/images/activities/Quizz.jpg'
where title = 'Quiz Night at Morrisseys Pub'
  and (image_url is null or trim(image_url) = '');

update public.activities
set image_url = '/images/activities/Pizza.jpg'
where title = 'Pizza Experience'
  and (image_url is null or trim(image_url) = '');

update public.activities
set image_url = '/images/activities/Brunch.jpg'
where title = 'Coffee & Brunch'
  and (image_url is null or trim(image_url) = '');

update public.activities
set image_url = '/images/activities/Boat%20trip%20day.jpg'
where title = 'Boat Trip'
  and (image_url is null or trim(image_url) = '');

update public.activities
set image_url = '/images/activities/Boat%20Trip%20Sunset.jpg'
where title = 'Sunset Boat Trip'
  and (image_url is null or trim(image_url) = '');

update public.activities
set image_url = '/images/activities/Flamenco.jpg'
where title = 'Flamenco Show'
  and (image_url is null or trim(image_url) = '');

notify pgrst, 'reload schema';
