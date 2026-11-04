<?php
/**
 * Check the product page's theme-side assets and wrapper.
 *
 *   php probe-product-page-assets.php
 *
 * Two things are verified:
 *
 *   1. assets/js/sections/product-page.js and assets/css/product-elementor.css
 *      are enqueued on a product route, and
 *   2. emifree_render_product_body() prints the .emifree-product-doc
 *      wrapper the stylesheet and the script scope themselves to.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

// Pretend the request is /en/products/mechanical/.
set_query_var( 'emifree_product', 'post' );
set_query_var( 'emifree_product_slug', 'mechanical' );
set_query_var( 'emifree_product_lang', 'en' );

do_action( 'wp_enqueue_scripts' );

printf( "script emifree-product-page    : %s\n", wp_script_is( 'emifree-product-page', 'enqueued' ) ? 'enqueued' : 'MISSING' );
printf( "style  emifree-product-elementor: %s\n", wp_style_is( 'emifree-product-elementor', 'enqueued' ) ? 'enqueued' : 'MISSING' );

ob_start();
emifree_render_product_body( 'mechanical', 'en' );
$emifree_html = ob_get_clean();

printf( "\nrendered body: %d bytes\n", strlen( $emifree_html ) );
printf( "wrapper  .emifree-product-doc : %s\n", false !== strpos( $emifree_html, 'class="emifree-product-doc"' ) ? 'present' : 'MISSING' );
printf( "elementor wrapper              : %s\n", false !== strpos( $emifree_html, 'class="elementor elementor-44"' ) ? 'present' : 'MISSING' );

foreach ( array( 'emifree-hero', 'emifree-gallery-main', 'emifree-thumb-1', 'emifree-dimensions', 'emifree-performance', 'emifree-specs', 'emifree-brochure', 'emifree-submenu', 'emifree-nav-hero', 'emifree-nav-brochure', 'emifree-back-to-top' ) as $emifree_id ) {
	printf( "  #%-22s : %s\n", $emifree_id, false !== strpos( $emifree_html, 'id="' . $emifree_id . '"' ) ? 'ok' : 'MISSING' );
}

// The anchor colour must NOT be the kit accent — the theme rule wins.
printf( "\nlink count: %d\n", substr_count( $emifree_html, '<a ' ) );
