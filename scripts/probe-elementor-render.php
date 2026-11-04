<?php
/**
 * Prove that an atomic Elementor document can be rendered from a context
 * that is NOT a singular post of that document — the situation the product
 * virtual routes create.
 *
 *   php -c tools/php-guard.ini scripts/probe-elementor-render.php [post_id]
 *
 * Reproduces the route pipeline:
 *   1. an early `wp_enqueue_scripts` callback fires `elementor/post/render`
 *      for the document (Elementor only does this itself when is_singular())
 *   2. Elementor's own enqueue_styles() runs at priority 20 and fires
 *      `elementor/frontend/after_enqueue_post_styles`
 *   3. the document is rendered with get_builder_content_for_display()
 *
 * Reports the markup, the enqueued stylesheets and any PHP notices.
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$doc_id = isset( $argv[1] ) ? (int) $argv[1] : 72;

$notices = array();
set_error_handler(
	static function ( $errno, $errstr, $errfile, $errline ) use ( &$notices ) {
		$notices[] = sprintf( '%s in %s:%d', $errstr, basename( $errfile ), $errline );
		return true;
	}
);

// --- diagnostics -------------------------------------------------------

$trace = array();

add_action(
	'wp_enqueue_scripts',
	static function () use ( $doc_id, &$trace ) {
		$trace[] = 'wp_enqueue_scripts p5: firing elementor/post/render ' . $doc_id;
		do_action( 'elementor/post/render', $doc_id );
	},
	5
);

// THE FIX: Elementor only registers its own enqueue_styles() callback when
// is_singular() is true (Frontend::init()). A virtual route is never singular,
// so the callback is never hooked and the atomic CSS is never generated.
// Frontend::enqueue_styles() is public — call it ourselves.
add_action(
	'wp_enqueue_scripts',
	static function () use ( $doc_id, &$trace ) {
		$trace[] = 'wp_enqueue_scripts p10: calling Frontend::enqueue_styles()';
		\Elementor\Plugin::instance()->frontend->enqueue_styles();
	},
	10
);

add_action(
	'elementor/frontend/after_enqueue_post_styles',
	static function () use ( &$trace ) {
		$trace[] = 'elementor/frontend/after_enqueue_post_styles fired';
	},
	99
);

add_action(
	'elementor/atomic-widgets/styles/register',
	static function ( $manager, $post_ids ) use ( &$trace ) {
		$trace[] = 'atomic-widgets/styles/register fired with post_ids=[' . implode( ',', (array) $post_ids ) . ']';
	},
	1,
	2
);

add_filter(
	'elementor/atomic_widgets/editor_data/element_styles',
	static function ( $styles ) use ( &$trace ) {
		$trace[] = 'element_styles filter: ' . count( (array) $styles ) . ' style(s)';
		return $styles;
	}
);

printf( "document id      : %d\n", $doc_id );
printf( "is_singular()    : %s\n", is_singular() ? 'yes' : 'no' );
printf( "get_the_ID()     : %s\n", get_the_ID() ? get_the_ID() : '(none)' );

// Step 2: run the enqueue chain.
do_action( 'wp_enqueue_scripts' );

$queued = wp_styles()->queue;
printf( "queued styles    : %d\n", count( $queued ) );
foreach ( $queued as $handle ) {
	printf( "  %s\n", $handle );
}

// What did the atomic styles manager see?
$manager = \Elementor\Modules\AtomicWidgets\Styles\Atomic_Styles_Manager::instance();
$ref     = new ReflectionObject( $manager );

$prop = $ref->getProperty( 'post_ids' );
$prop->setAccessible( true );
$post_ids = $prop->getValue( $manager );

$prop = $ref->getProperty( 'registered_styles_by_key' );
$prop->setAccessible( true );
$registered = $prop->getValue( $manager );

printf( "\nmanager post_ids : [%s]\n", implode( ',', (array) $post_ids ) );
printf( "registered keys  : %s\n", $registered ? implode( ', ', array_keys( $registered ) ) : '(none)' );

printf( "\n--- action trace ---\n" );
foreach ( $trace as $line ) {
	printf( "  %s\n", $line );
}

// Step 3: render the document.
$frontend = \Elementor\Plugin::instance()->frontend;
$html     = (string) $frontend->get_builder_content_for_display( $doc_id, false );

printf( "\nrendered bytes   : %d\n", strlen( $html ) );
printf( "has elementor-%d : %s\n", $doc_id, false !== strpos( $html, 'elementor-' . $doc_id ) ? 'yes' : 'NO' );
printf( "has e-con markup : %s\n", false !== strpos( $html, 'e-con' ) ? 'yes' : 'NO' );

printf( "php notices      : %d\n", count( $notices ) );
foreach ( array_slice( $notices, 0, 8 ) as $notice ) {
	printf( "  %s\n", $notice );
}

// Step 4: with $with_css = true the CSS is prepended to the returned markup.
$with_css = (string) $frontend->get_builder_content_for_display( $doc_id, true );
printf( "with_css bytes   : %d (delta %d)\n", strlen( $with_css ), strlen( $with_css ) - strlen( $html ) );
printf( "has inline style : %s\n", false !== strpos( $with_css, '<style' ) ? 'yes' : 'NO' );
