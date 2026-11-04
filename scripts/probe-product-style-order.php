<?php
/**
 * Print the stylesheet order for a product route.
 *
 *   php probe-product-style-order.php
 *
 * Elementor emits the atomic CSS in three files — base (widget defaults),
 * default (kit tag defaults) and local (the document's own element
 * styles). Their enqueue order decides which wins a specificity tie, so
 * the order has to be known, not guessed: `.elementor .e-default-a` and
 * `.elementor .e-<hash>` both carry (0,2,0).
 *
 * This simulates the product route, fires wp_enqueue_scripts and prints
 * every stylesheet in the order the browser receives it.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

// Pretend the request is /en/products/mechanical/.
set_query_var( 'emifree_product', 'post' );
set_query_var( 'emifree_product_slug', 'mechanical' );
set_query_var( 'emifree_product_lang', 'en' );

$emifree_order = array();

add_filter(
	'style_loader_tag',
	function ( $tag, $handle, $href ) {
		global $emifree_order;
		$emifree_order[] = $handle . '  ' . $href;
		return $tag;
	},
	10,
	3
);

do_action( 'wp_enqueue_scripts' );

// Printing the queue is what fires style_loader_tag.
wp_print_styles();

echo "--- stylesheet order (as the browser receives it)\n";
foreach ( $emifree_order as $emifree_index => $emifree_entry ) {
	printf( "%2d. %s\n", $emifree_index + 1, $emifree_entry );
}

echo "\n--- scripts\n";
global $emifree_scripts;
if ( isset( $emifree_scripts ) ) {
	foreach ( $emifree_scripts->queue as $emifree_handle ) {
		printf( "    %s\n", $emifree_handle );
	}
}
