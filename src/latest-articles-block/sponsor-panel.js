/**
 * "Sponsorship" panel in the post sidebar, for the sponsored_by meta.
 */
import { __ } from '@wordpress/i18n';
import { registerPlugin } from '@wordpress/plugins';
import {
	PluginDocumentSettingPanel,
	store as editorStore,
} from '@wordpress/editor';
import { TextControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEntityProp } from '@wordpress/core-data';

function SponsorPanel() {
	const postType = useSelect(
		( select ) => select( editorStore ).getCurrentPostType(),
		[]
	);
	const [ meta, setMeta ] = useEntityProp( 'postType', 'post', 'meta' );

	// Only posts can appear in the block.
	if ( postType !== 'post' ) {
		return null;
	}

	return (
		<PluginDocumentSettingPanel
			name="oyic-sponsor"
			title={ __( 'Sponsorship', 'latest-articles-block' ) }
		>
			<TextControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Sponsored by', 'latest-articles-block' ) }
				help={ __(
					'Brand name shown on Latest Articles cards. Leave empty if the post is not sponsored.',
					'latest-articles-block'
				) }
				value={ meta?.sponsored_by ?? '' }
				onChange={ ( value ) =>
					setMeta( { ...meta, sponsored_by: value } )
				}
			/>
		</PluginDocumentSettingPanel>
	);
}

registerPlugin( 'oyic-sponsor-panel', { render: SponsorPanel } );
