/**
 * Retrieves the translation of text.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/packages/packages-i18n/
 */
import { __, sprintf } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	Placeholder,
	RangeControl,
	SelectControl,
	ToggleControl,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import ServerSideRender from '@wordpress/server-side-render';
import metadata from './block.json';
import './editor.scss';

/**
 * Editor view: sidebar settings plus a live preview rendered by render.php.
 *
 * @param {Object}   props		 Block props.
 * @param {Object}   props.attributes	 Saved block settings.
 * @param {Function} props.setAttributes Updates block settings.
 * @return {Element} Element to render.
 */
export default function Edit( { attributes, setAttributes } ) {
	const { categoryId, showCategoryLabel, showExcerpt, postsToShow } =
		attributes;

	// All post categories via the REST API. null while loading.
	const categories = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecords( 'taxonomy', 'category', {
				per_page: -1,
				orderby: 'name',
				order: 'asc',
				_fields: 'id,name,count',
			} ),
		[]
	);

	const categoryOptions = [
		{ label: __( 'Select a category', 'latest-articles-block' ), value: 0 },
		...( categories ?? [] ).map( ( category ) => ( {
			label: `${ decodeEntities( category.name ) } (${ category.count })`,
			value: category.id,
		} ) ),
	];

	const selected = categories?.find( ( c ) => c.id === categoryId );

	const categoryControl =
		categories === null ? (
			<Spinner />
		) : (
			<SelectControl
				__next40pxDefaultSize
				__nextHasNoMarginBottom
				label={ __( 'Category', 'latest-articles-block' ) }
				value={ categoryId }
				options={ categoryOptions }
				onChange={ ( value ) =>
					setAttributes( { categoryId: parseInt( value, 10 ) } )
				}
			/>
		);

	let preview;
	if ( ! selected ) {
		// Nothing chosen yet, or the saved category has been deleted.
		preview = (
			<Placeholder
				icon="excerpt-view"
				label={ __( 'Latest Articles', 'latest-articles-block' ) }
				instructions={
					categoryId && categories
						? __(
								'The chosen category no longer exists. Pick another one.',
								'latest-articles-block'
							)
						: __(
								'Choose a category to show its newest posts.',
								'latest-articles-block'
							)
				}
			>
				{ categoryControl }
			</Placeholder>
		);
	} else {
		preview = (
			<ServerSideRender
				block={ metadata.name }
				attributes={ attributes }
				EmptyResponsePlaceholder={ () => (
					<Placeholder
						icon="excerpt-view"
						label={ __(
							'Latest Articles',
							'latest-articles-block'
						) }
						instructions={ sprintf(
							/* translators: %s: category name */
							__(
								'No published posts in “%s” yet. The block fills in automatically once one is published.',
								'latest-articles-block'
							),
							decodeEntities( selected.name )
						) }
					/>
				) }
			/>
		);
	}

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'latest-articles-block' ) }>
					{ categoryControl }
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __(
							'Display category label',
							'latest-articles-block'
						) }
						checked={ showCategoryLabel }
						onChange={ ( value ) =>
							setAttributes( { showCategoryLabel: value } )
						}
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __(
							'Show subtext (excerpt)',
							'latest-articles-block'
						) }
						help={ __(
							'Shown on the featured article only.',
							'latest-articles-block'
						) }
						checked={ showExcerpt }
						onChange={ ( value ) =>
							setAttributes( { showExcerpt: value } )
						}
					/>
					<RangeControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __(
							'Number of posts',
							'latest-articles-block'
						) }
						help={ __(
							'Includes the featured article.',
							'latest-articles-block'
						) }
						value={ postsToShow }
						onChange={ ( value ) =>
							setAttributes( { postsToShow: value } )
						}
						min={ 1 }
						max={ 9 }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps() }>{ preview }</div>
		</>
	);
}
