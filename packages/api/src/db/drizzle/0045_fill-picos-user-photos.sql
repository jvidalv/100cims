-- User-supplied photo for Aguja de los Cabrones I (was NULL).
-- Torre del Friero's S3 object was also overwritten with a better user photo;
-- no SQL UPDATE needed since the URL is unchanged.

UPDATE mountain SET image_url = 'https://josepvidal-public-dev-bucket.s3.eu-west-3.amazonaws.com/100cims/mountain/profile/aguja-de-los-cabrones-i.jpg' WHERE slug = 'aguja-de-los-cabrones-i';
