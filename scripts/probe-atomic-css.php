<?php
/**
 * Regenerate and inspect a document's atomic stylesheet.
 *
 *   php probe-atomic-css.php <post_id> [--grep "selector"]
 *
 * Elementor writes the atomic-widget stylesheet as a side effect of a
 * front-end render, not when the document is read:
 *
 *   elementor/post/render
 *     -> elementor/frontend/after_enqueue_post_styles
 *       -> Atomic_Styles_Manager::enqueue_styles()
 *         -> CSS_Files_Manager::get()
 *           -> uploads/elementor/css/local-<id>-frontend-{desktop,tablet,mobile}.css
 *
 * So `get_builder_content_for_display()` renders HTML but never rewrites
 * the CSS. This probe runs that pipeline and then prints the generated
 * rules, optionally filtered by a substring.
 *
 * It deliberately does NOT delete `_elementor_element_cache` — the
 * element cache is a rendering cache, not a stylesheet, and clearing it
 * is the theme's job (see the Elementor rebuild notes).
 */

define( 'WP_USE_THEMES', false );
require 'C:/Users/vpedr/Local Sites/landingwptest/app/public/wp-load.php';

$emifree_post_id = isset( $argv[1] ) ? (int) $argv[1] : 44;
$emifree_grep    = '';
$emifree_argv    = array_slice( $argv, 2 );
foreach ( $emifree_argv as $emifree_i => $emifree_arg ) {
	if ( '--grep' === $emifree_arg && isset( $emifree_argv[ $emifree_i + 1 ] ) ) {
		$emifree_grep = $emifree_argv[ $emifree_i + 1 ];
	}
}

if ( ! class_exists( '\Elementor\Plugin' ) ) {
	fwrite( STDERR, "Elementor is not active.\n" );
	exit( 1 );
}

// The front-end pipeline.
\Elementor\Plugin::$instance->frontend->init();
do_action( 'elementor/post/render', $emifree_post_id );
do_action( 'elementor/frontend/after_enqueue_post_styles' );

$emifree_css_dir = trailingslashit( wp_upload_dir()['basedir'] ) . 'elementor/css/';
$emifree_files   = glob( $emifree_css_dir . 'local-' . $emifree_post_id . '-*.css' );

if ( ! $emifree_files ) {
	printf( "post %d — no stylesheet generated\n", $emifree_post_id );
	exit( 1 );
}

foreach ( $emifree_files as $emifree_file ) {
	$emifree_css = file_get_contents( $emifree_file );
	printf(
		"--- %s (%d bytes)\n",
		basename( $emifree_file ),
		strlen( $emifree_css )
	);

	if ( '' === $emifree_grep ) {
		continue;
	}

	// Print every rule whose body mentions the needle.
	preg_match_all( '/([^{}]+)\{([^{}]*)\}/', $emifree_css, $emifree_rules, PREG_SET_ORDER );
	$emifree_hits = 0;
	foreach ( $emifree_rules as $emifree_rule ) {
		if ( false !== strpos( $emifree_rule[2], $emifree_grep ) || false !== strpos( $emifree_rule[1], $emifree_grep ) ) {
			printf( "  %s { %s }\n", trim( $emifree_rule[1] ), trim( $emifree_rule[2] ) );
			$emifree_hits++;
		}
	}
	printf( "  (%d rule(s) matching '%s')\n", $emifree_hits, $emifree_grep );
}
