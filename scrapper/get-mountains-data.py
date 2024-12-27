import requests
import json
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import time

links = []

file_path = "./data/urls.json"
output_file = "./data/inserts.sql"

try:
    # Open the JSON file and load its content
    with open(file_path, 'r') as file:
        data = json.load(file)

        # Access a specific property ('nested_key' in this case)
        links = data

except Exception as e:
    print("Exception occurred opening json", e)

data = []
def extract_slug(url):
    # Parse the URL
    parsed_url = urlparse(url)
    # Get the path and split it into parts
    path_parts = parsed_url.path.strip('/').split('/')
    # Return the last part as the slug
    return path_parts[-1] if path_parts else None

for index, link in enumerate(links):
    try:
        # Fetch the HTML content of the page using requests
        response = requests.get(link)

        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            # Parse the HTML content using BeautifulSoup
            soup = BeautifulSoup(response.text, 'lxml')

            sidebar_content = soup.select('.section-cim-content .order-lg-2 .row.no-gutters')[0].select("*")
            image_element = soup.select('.section-cim-content .wp-post-image')
            # Check if the selection is not empty
            if image_element:
                image = image_element[0].get('src')  # Get the 'src' attribute
            else:
                image = None  # Set a default value if the element is not found

            item = {
                "name": soup.select('h1 > strong.ttuc')[0].text,
                "location": sidebar_content[1].text.strip(),
                "height": str.replace(sidebar_content[3].text, " m", ""),
                "latitude" : str.replace(sidebar_content[5].text, "º", ""),
                "longitude" : str.replace(sidebar_content[7].text, "º", ""),
                "essential" : bool(soup.find(string='Cim essencial')),
                "utm_31t_x" : sidebar_content[9].text,
                "utm_31t_y" : sidebar_content[11].text,
                "url": link,
                "image_url": image,
                "slug": extract_slug(link),
            }

            with open(output_file, "a") as file:  # Open in append mode
                name = item["name"].replace("'", "''")
                slug = item["slug"].replace("'", "''")
                location = item["location"].replace("'", "''")

                table_name = "mountains"
                # Format the SQL INSERT statement
                sql = (
                    f"INSERT INTO {table_name} (slug, name, location, height, latitude, longitude, essential, utm_31t_x, utm_31t_y, url, image_url) "
                    f"VALUES ('{slug}', '{name}', '{location}', {item['height']}, {item['latitude']}, {item['longitude']}, "
                    f"{str(item['essential']).upper()}, {item['utm_31t_x']}, {item['utm_31t_y']}, '{item['url']}', '{item['image_url']}');\n"
                )

                # Write the SQL statement to the file
                file.write(sql)

            with open(file_path, "r") as file:
                data = json.load(file)

            # Remove the string while keeping the order
            filtered_data = [item for item in data if item != link]

            # Overwrite the JSON file with the updated data
            with open(file_path, "w") as file:
                json.dump(filtered_data, file, indent=4)

            print("Done: ", link)
        else:
            print("Failed to fetch the page. Status code:", response.status_code, link)
    except requests.RequestException as e:
        print("Error fetching the page:", e)
        exit(1)


# File to write SQL inserts

# SQL table name
# table_name = "mountains"

# Open the file in write mode
# with open(output_file, "a") as file:  # Open in append mode
#     for item in data:
#         # Escape single quotes in strings
#         name = item["name"].replace("'", "''")
#         slug = item["slug"].replace("'", "''")
#
#         # Format the SQL INSERT statement
#         sql = (
#             f"INSERT INTO {table_name} (slug, name, height, latitude, longitude, essential, utm_31t_x, utm_31t_y, url, image_url) "
#             f"VALUES ('{slug}', '{name}', {item['height']}, {item['latitude']}, {item['longitude']}, "
#             f"{str(item['essential']).upper()}, {item['utm_31t_x']}, {item['utm_31t_y']}, '{item['url']}', '{item['image_url']}');\n"
#         )
#
#         # Write the SQL statement to the file
#         file.write(sql)
#
# print(f"SQL INSERT statements have been appended to {output_file}.")

exit(1)
#
# with open("./data/insert.sql", "w") as outfile:
#     outfile.write(json.dumps({'links': links}, indent=4))