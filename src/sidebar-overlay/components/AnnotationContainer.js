import React from 'react'
import PropTypes from 'prop-types'
import moment from 'moment'

import Annotation from './Annotation'
import styles from './Annotation.css'
import { IndexDropdown } from '../../common-ui/containers'

class AnnotationContainer extends React.Component {
    static propTypes = {
        annotation: PropTypes.object.isRequired,
        deleteAnnotation: PropTypes.func.isRequired,
        editAnnotation: PropTypes.func.isRequired,
        goToAnnotation: PropTypes.func.isRequired,
        env: PropTypes.string.isRequired,
    }

    state = {
        truncated: {},

        annotationText: '',
        annotationEditMode: false,

        containsTags: false,
        tags: [],

        footerState: 'default',
    }

    componentDidMount() {
        const { annotation } = this.props
        const truncated = {}
        let annotationText = ''
        let containsTags = false

        if (annotation.body)
            truncated.highlight = this.getTruncatedObject(annotation.body)

        if (annotation.comment) {
            truncated.annotation = this.getTruncatedObject(annotation.comment)
            annotationText = annotation.comment
        }

        if (annotation.tags && annotation.tags.length) containsTags = true

        this.setState({
            truncated,
            annotationText,
            containsTags,
        })
    }

    getTruncatedObject = text => {
        if (text.length > 280) {
            const truncatedText = text.slice(0, 280) + ' [..]'
            return {
                isTruncated: true,
                text: truncatedText,
            }
        }
        return null
    }

    handleChange = e => {
        this.setState({
            annotationText: e.target.value,
        })
    }

    handleDeleteAnnotation = e => {
        e.preventDefault()
        e.stopPropagation()
        const { url } = this.props.annotation
        this.setFooterState('default')
        this.props.deleteAnnotation({ url })
    }

    handleEditAnnotation = e => {
        e.preventDefault()
        e.stopPropagation()
        const { url, comment } = this.props.annotation
        const { annotationText } = this.state

        if (annotationText === comment) return

        this.props.editAnnotation({ url, comment: annotationText })
        this.toggleEditAnnotation()
    }

    addTag = newTag => {
        const tags = [newTag, ...this.state.tags]
        this.setState({
            tags,
        })
    }

    delTag = tag => {
        const oldTags = [...this.state.tags]
        const tagIndex = oldTags.indexOf(tag)

        if (tagIndex === -1) return null

        const tags = [
            ...oldTags.slice(0, tagIndex),
            ...oldTags.slice(tagIndex + 1),
        ]

        this.setState({
            tags,
        })
    }

    renderTimestamp = () => {
        const { footerState } = this.state
        const createdWhen = new Date(this.props.annotation.createdWhen)

        const timestamp = moment(createdWhen).format('MMMM D YYYY')

        return (
            <div className={styles.timestamp}>
                {footerState === 'default' ? timestamp : ''}
            </div>
        )
    }

    renderFooterIcons = () => {
        const { annotation, env } = this.props
        return (
            <div className={styles.footerAside}>
                <span
                    className={styles.trashIcon}
                    onClick={this.setFooterState('delete')}
                />
                <span
                    className={styles.editIcon}
                    onClick={this.toggleEditAnnotation}
                />
                {env === 'overview' && annotation.body ? (
                    <a href={annotation.url} target="blank">
                        <span className={styles.goToPageIcon} />
                    </a>
                ) : null}
            </div>
        )
    }

    renderEditButtons = () => {
        return (
            <div className={styles.footerAside}>
                <span
                    className={styles.footerText}
                    onClick={this.toggleEditAnnotation}
                >
                    Cancel
                </span>
                <span
                    className={styles.footerGreenText}
                    onClick={this.handleEditAnnotation}
                >
                    Save
                </span>
            </div>
        )
    }

    renderDeleteButtons = () => {
        return (
            <div className={styles.footerAside}>
                <span
                    className={styles.footerGreenText}
                    onClick={this.handleDeleteAnnotation}
                >
                    Yes
                </span>
                <span
                    className={styles.footerText}
                    onClick={this.setFooterState('default')}
                >
                    Cancel
                </span>
            </div>
        )
    }

    renderTagPills = () => {
        const { tags } = this.props.annotation
        if (!tags) return
        return tags.map((tag, i) => (
            <span key={i} className={styles.tagPill}>
                {tag}
            </span>
        ))
    }

    findFooterRenderer(state) {
        if (state === 'default') return this.renderFooterIcons()
        else if (state === 'edit') return this.renderEditButtons()
        else if (state === 'delete') return this.renderDeleteButtons()
    }

    renderFooter = () => {
        const { footerState } = this.state
        return (
            <div className={styles.footer}>
                {this.renderTimestamp()}
                {this.findFooterRenderer(footerState)}
            </div>
        )
    }

    toggleState = stateName => () => {
        const toggled = !this.state[stateName]
        this.setState({
            [stateName]: toggled,
        })
    }

    toggleTruncation = name => () => {
        const truncated = { ...this.state.truncated }
        truncated[name].isTruncated = !truncated[name].isTruncated

        this.setState({
            truncated,
        })
    }

    setFooterState = footerState => () =>
        this.setState({
            footerState,
        })

    toggleEditAnnotation = () => {
        this.toggleState('annotationEditMode')()
        if (this.state.footerState === 'edit') this.setFooterState('default')()
        else this.setFooterState('edit')()
    }

    renderShowButton = name => {
        const { truncated } = this.state
        if (truncated[name]) {
            return (
                <div
                    className={styles.showMore}
                    onClick={this.toggleTruncation(name)}
                >
                    Show{' '}
                    {this.state.truncated[name].isTruncated ? 'more' : 'less'}
                </div>
            )
        }
        return null
    }

    renderHighlight = () => {
        const { truncated } = this.state
        if (truncated.highlight && truncated.highlight.isTruncated)
            return truncated.highlight.text
        else return this.props.annotation.body
    }

    renderAnnotation = () => {
        const { truncated, annotationEditMode } = this.state
        if (annotationEditMode) return ''
        if (truncated.annotation && truncated.annotation.isTruncated)
            return truncated.annotation.text
        else return this.props.annotation.comment
    }

    renderAnnotationInput = () => {
        if (this.state.annotationEditMode)
            return (
                <div className={styles.annotationInput}>
                    <textarea
                        rows="5"
                        cols="20"
                        className={styles.annotationTextarea}
                        value={this.state.annotationText}
                        onChange={this.handleChange}
                    />
                    <IndexDropdown
                        isForAnnotation
                        url={this.props.annotation.url}
                        initFilters={this.state.tags}
                        onFilterAdd={this.addTag}
                        onFilterDel={this.delTag}
                        source="tag"
                    />
                </div>
            )
        return null
    }

    deriveTagsClass = () =>
        this.state.containsTags ? styles.tagsContainer : ''

    deriveIsClickable = () => {
        return this.props.env === 'iframe' && this.props.annotation.body !== ''
    }

    render() {
        console.log(this.state.tags)
        return (
            <Annotation
                renderHighlight={this.renderHighlight}
                renderShowButton={this.renderShowButton}
                renderAnnotation={this.renderAnnotation}
                annotationEditMode={this.state.annotationEditMode}
                deriveTagsClass={this.deriveTagsClass}
                renderTagPills={this.renderTagPills}
                renderAnnotationInput={this.renderAnnotationInput}
                renderFooter={this.renderFooter}
                goToAnnotation={this.props.goToAnnotation}
                isClickable={this.deriveIsClickable()}
            />
        )
    }
}

export default AnnotationContainer
