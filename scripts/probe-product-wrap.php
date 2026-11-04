<?php
/**
 * Print the first bytes of a product document's rendered HTML.
 *
 *   php probe-product-wrap.php 44
 *
 * The question it answers: does the rendered output carry Elementor's
 * `.elementor` wrapper element? Every atomic rule is written as
 * `.elementor .e-<hash>`, so the wrapper has to be in the document or
 * the page renders unstyled.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_post_id = isset( $argv[1] ) ? (int) $argv[1] : 44;

$emifree_html = \Elementor\Plugin::instance()->frontend->get_builder_content_for_display( $emifree_post_id, false );

printf( "--- first 700 bytes\n%s\n\n", substr( (string) $emifree_html, 0, 700 ) );
printf( "--- last 400 bytes\n%s\n", substr( (string) $emifree_html, -400 ) );
