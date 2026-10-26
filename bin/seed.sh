#!/usr/bin/env bash
#
# Seed demo content for testing the Latest Articles block.
#
# Run inside the WordPress site (e.g. Local → right-click site → Open site shell):
#   bash /path/to/latest-articles-block/bin/seed.sh          # create content
#   bash /path/to/latest-articles-block/bin/seed.sh --reset  # remove it again
#
# Creates:
#   Gardening  – 6 posts (one more than the block shows), 1 old sticky post,
#                1 post without a featured image, 1 sponsored post
#   Decorating – 5 posts, 2 also filed under Homes
#   Homes      – 5 posts (incl. the 2 shared with Decorating), 1 sponsored
#   News       – 3 posts (fewer than five)
#   Travel     – empty category
#   A "Block test" page with the block placed for Gardening, News and Travel.
#
# Every seeded post/page gets the meta key _lab_seed so --reset can find it.
# Featured images are downloaded from picsum.photos; if that fails the post
# is kept without an image (which the block must handle anyway).

set -euo pipefail

SEED_KEY="_lab_seed"

if ! wp core is-installed >/dev/null 2>&1; then
	echo "Run this from a WordPress site shell (wp core is-installed failed)." >&2
	exit 1
fi

# --- Reset ------------------------------------------------------------------

if [[ "${1:-}" == "--reset" ]]; then
	ids=$(wp post list --post_type=post,page,attachment --post_status=any \
		--meta_key="$SEED_KEY" --format=ids)
	if [[ -n "$ids" ]]; then
		# shellcheck disable=SC2086
		wp post delete $ids --force >/dev/null
	fi
	for slug in gardening decorating homes news travel; do
		wp term delete category "$slug" --by=slug >/dev/null 2>&1 || true
	done
	echo "Seeded content removed."
	exit 0
fi

# --- Helpers ----------------------------------------------------------------

# Date N days ago, works with BSD (macOS) and GNU date.
days_ago() {
	if date -v-1d >/dev/null 2>&1; then
		date -v-"$1"d '+%Y-%m-%d 09:00:00'
	else
		date -d "-$1 days" '+%Y-%m-%d 09:00:00'
	fi
}

# Get a category ID by slug, creating the category if needed.
category_id() {
	local name="$1" slug="$2" id
	id=$(wp term get category "$slug" --by=slug --field=term_id 2>/dev/null || true)
	if [[ -z "$id" ]]; then
		id=$(wp term create category "$name" --slug="$slug" --porcelain)
	fi
	echo "$id"
}

# create_post <category ids, comma-separated> <days ago> <with image: 1|0> <title> [excerpt] [sponsor]
create_post() {
	local cats="$1" age="$2" image="$3" title="$4" excerpt="${5:-}" sponsor="${6:-}"
	local meta="{\"$SEED_KEY\":\"1\"}"
	if [[ -n "$sponsor" ]]; then
		meta="{\"$SEED_KEY\":\"1\",\"sponsored_by\":\"$sponsor\"}"
	fi

	local id
	id=$(wp post create \
		--post_type=post \
		--post_status=publish \
		--post_title="$title" \
		--post_excerpt="$excerpt" \
		--post_content="<!-- wp:paragraph --><p>Demo article body for “${title}”.</p><!-- /wp:paragraph -->" \
		--post_category="$cats" \
		--post_date="$(days_ago "$age")" \
		--meta_input="$meta" \
		--porcelain)

	if [[ "$image" == "1" ]]; then
		local att
		if att=$(wp media import "https://picsum.photos/seed/lab-$id/1630/918.jpg" \
			--post_id="$id" --featured_image --title="$title" --porcelain 2>/dev/null); then
			wp post meta update "$att" "$SEED_KEY" 1 >/dev/null
		else
			echo "  (no image for post $id: download failed)"
		fi
	fi
	echo "  #$id  $title"
}

# --- Categories -------------------------------------------------------------

echo "Categories…"
GARDENING=$(category_id "Gardening" gardening)
DECORATING=$(category_id "Decorating" decorating)
HOMES=$(category_id "Homes" homes)
NEWS=$(category_id "News" news)
TRAVEL=$(category_id "Travel" travel)

# --- Posts ------------------------------------------------------------------
# Lower "days ago" = newer. The newest post in a category becomes the hero.

echo "Gardening (6 posts + 1 sticky)…"
create_post "$GARDENING" 1 1 "How to plan a cottage garden that flowers from spring to autumn" \
	"Layer bulbs, perennials and self-seeders for months of colour."
create_post "$GARDENING" 2 1 "Ten shade-loving plants for a north-facing border" "" "Greenhouse Co."
create_post "$GARDENING" 3 0 "Is it too late to plant garlic this year?"
create_post "$GARDENING" 4 1 "The low-maintenance lawn alternatives gardeners swear by, from clover to creeping thyme and chamomile"
create_post "$GARDENING" 5 1 "What to sow in October"
create_post "$GARDENING" 6 1 "This post is sixth newest and should NOT appear in the block"
old=$(wp post create --post_type=post --post_status=publish \
	--post_title="Old sticky post: should NOT jump to the top" \
	--post_category="$GARDENING" --post_date="$(days_ago 40)" \
	--meta_input="{\"$SEED_KEY\":\"1\"}" --porcelain)
wp eval "stick_post( $old );"
echo "  #$old  (sticky)"

echo "Decorating (5 posts, 2 shared with Homes)…"
create_post "$DECORATING" 1 1 "Warm minimalism: the paint colours designers are choosing now" \
	"Soft clay, putty and mushroom tones that make small rooms feel calm."
create_post "$DECORATING,$HOMES" 2 1 "Seven ways to make a rented living room feel like yours"
create_post "$DECORATING" 3 1 "Should your skirting boards match your walls?"
create_post "$DECORATING,$HOMES" 5 0 "Inside a 1920s terrace with a bold, colourful kitchen"
create_post "$DECORATING" 7 1 "The return of the statement ceiling"

echo "Homes (3 more posts, 1 sponsored)…"
create_post "$HOMES" 1 1 "A converted chapel in the Cotswolds that keeps its stained glass" \
	"The owners spent four years restoring the building by hand."
create_post "$HOMES" 3 1 "How much does a loft conversion really cost?" "" "BuildRight Finance"
create_post "$HOMES" 4 1 "Barn conversions: what to know before you buy"

echo "News (3 posts)…"
create_post "$NEWS" 1 1 "Garden show announces dates for next year's festival" \
	"Tickets go on sale in the new year."
create_post "$NEWS" 2 0 "Hosepipe ban lifted across the region"
create_post "$NEWS" 4 1 "Readers vote for their favourite small garden of the year"

echo "Travel: left empty on purpose."

# --- Test page --------------------------------------------------------------

block() {
	echo "<!-- wp:heading --><h2 class=\"wp-block-heading\">$1</h2><!-- /wp:heading -->"
	echo "<!-- wp:oyic/latest-articles-block {\"categoryId\":$2} /-->"
}
content="$(block "Gardening (full layout)" "$GARDENING")
$(block "News (only 3 posts)" "$NEWS")
$(block "Travel (empty, renders nothing)" "$TRAVEL")"

page=$(wp post create --post_type=page --post_status=publish --post_title="Block test" \
	--post_content="$content" --meta_input="{\"$SEED_KEY\":\"1\"}" --porcelain)

echo
echo "Done. Test page: $(wp post get "$page" --field=url)"
echo "Category IDs: Gardening=$GARDENING Decorating=$DECORATING Homes=$HOMES News=$NEWS Travel=$TRAVEL"
