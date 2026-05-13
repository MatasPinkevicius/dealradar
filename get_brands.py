from bs4 import BeautifulSoup

with open('makes.html', 'r', encoding='utf-8') as f:
    content = f.read()

soup = BeautifulSoup(content, 'html.parser')

# Find the make_id section specifically
make_section = None
for tag in soup.find_all('make_id'):
    make_section = tag
    break

if not make_section:
    print("make_id section not found, trying alternative...")
    # Try finding by looking at the XML structure
    items = soup.find_all('item')
    print(f"Total items: {len(items)}")
else:
    items = make_section.find_all('item')
    print(f"Makes found: {len(items)}")
    for item in items:
        title = item.find('title')
        id_tag = item.find('id')
        if title and id_tag:
            print(f"{id_tag.get_text().strip()} = {title.get_text().strip()}")