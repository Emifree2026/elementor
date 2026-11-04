<?php
/**
 * Why does the second render of the same document differ from the first?
 *
 *   php -c tools/php-guard.ini scripts/diff-render.php [post_id]
 *
 * Renders the document twice and reports where the two markups diverge.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$doc_id = isset( $argv[1] ) ? (int) $argv[1] : 72;

$frontend = \Elementor\Plugin::instance()->frontend;

$first  = (string) $frontend->get_builder_content_for_display( $doc_id, false );
$second = (string) $frontend->get_builder_content_for_display( $doc_id, false );

printf( "first  : %d bytes\n", strlen( $first ) );
printf( "second : %d bytes\n", strlen( $second ) );

if ( $first === $second ) {
	printf( "identical\n" );
	exit( 0 );
}

// Find the first divergence.
$len = min( strlen( $first ), strlen( $second ) );
$at  = 0;
while ( $at < $len && $first[ $at ] === $second[ $at ] ) {
	$at++;
}

printf( "first divergence at byte %d\n", $at );
printf( "--- first  [%d..%d] ---\n%s\n", max( 0, $at - 120 ), min( strlen( $first ), $at + 260 ), substr( $first, max( 0, $at - 120 ), 380 ) );
printf( "--- second [%d..%d] ---\n%s\n", max( 0, $at - 120 ), min( strlen( $second ), $at + 260 ), substr( $second, max( 0, $at - 120 ), 380 ) );

// Which top-level elements survive in each?
foreach ( array( 'first' => $first, 'second' => $second ) as $label => $markup ) {
	preg_match_all( '/class="elementor-element elementor-element-([a-z0-9\-]+)[^"]*"\s+data-id="([a-z0-9]+)"/', $markup, $m );
	printf( "%s: %d element wrappers\n", $label, count( $m[0] ) );
}
preg_match_all( '/data-id="([a-z0-9]+)"/', $first, $m1 );
preg_match_all( '/data-id="([a-z0-9]+)"/', $second, $m2 );
printf( "ids only in first : %s\n", implode( ',', array_diff( $m1[1], $m2[1] ) ) );
printf( "ids only in second: %s\n", implode( ',', array_diff( $m2[1], $m1[1] ) ) );
