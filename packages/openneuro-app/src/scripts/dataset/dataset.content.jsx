// dependencies -------------------------------------------------------

import React from 'react'
import PropTypes from 'prop-types'
import Reflux from 'reflux'
import { Redirect, withRouter } from 'react-router-dom'
import { ProgressBar } from 'react-bootstrap'
import Spinner from '../common/partials/spinner.jsx'
import Timeout from '../common/partials/timeout.jsx'
import ErrorBoundary from '../errors/errorBoundary.jsx'
import datasetStore from './dataset.store'
import actions from './dataset.actions.js'
import MetaData from './dataset.metadata.jsx'
import Statuses from './dataset.statuses.jsx'
import Metrics from './dataset.metrics.jsx'
import Validation from '../datalad/validation/validation.jsx'
import ClickToEdit from '../common/forms/click-to-edit.jsx'
import FileTree from '../common/partials/file-tree.jsx'
import Jobs from './dataset.jobs.jsx'
import Summary from './dataset.summary.jsx'
import Comment from '../common/partials/comment.jsx'
import CommentTree from '../common/partials/comment-tree.jsx'
import UploadResume from '../uploader/upload-resume.jsx'
import LoginModal from '../common/partials/login.jsx'
import { refluxConnect } from '../utils/reflux'
import { getProfile } from '../authentication/profile.js'
import { formatDate } from '../utils/date.js'
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now'

let uploadWarning =
  'You are currently uploading files. Leaving this page will cancel the upload process.'

class DatasetContent extends Reflux.Component {
  constructor(props) {
    super(props)
    refluxConnect(this, datasetStore, 'datasets')

    const isDataset = pathname => {
      const slugs = pathname.split('/')
      if (
        slugs.length &&
        slugs[1] === 'datasets' &&
        this.state.datasets.dataset
      ) {
        let datasetId = this.state.datasets.dataset.linkID
        if ('linkOriginal' in this.state.datasets.dataset) {
          datasetId = this.state.datasets.dataset.linkOriginal
        }
        // The same dataset
        if (slugs[2] === datasetId) {
          return true
        }
      }
      return false
    }
    const unblock = props.history.block(({ pathname }) => {
      if (!isDataset(pathname) && this.state.datasets.uploading) {
        return uploadWarning
      }
    })
    this.state = { unblock, loginModal: false }
    this.toggleModal = this._toggleModal.bind(this)
  }
  // life cycle events --------------------------------------------------

  componentDidMount() {
    const isDataset = pathname => {
      const slugs = pathname.split('/')
      if (
        slugs.length &&
        slugs[1] === 'datasets' &&
        this.state.datasets.dataset
      ) {
        let datasetId = this.state.datasets.dataset.linkID
        if ('linkOriginal' in this.state.datasets.dataset) {
          datasetId = this.state.datasets.dataset.linkOriginal
        }
        // The same dataset
        if (slugs[2] === datasetId) {
          return true
        }
      }
      return false
    }
    this.props.history.listen(({ pathname }) => {
      if (!isDataset(pathname) && this.state.datasets.uploading) {
        actions.cancelDirectoryUpload()
      }
    })
  }

  componentWillUpdate() {
    // Prevent navigation away if adding a directory
    if (this.state.datasets.uploading) {
      window.onbeforeunload = () => {
        // Warning not shown in modern browsers but we have to return something
        return uploadWarning
      }
    } else {
      window.onbeforeunload = () => {}
    }
  }

  componentWillUnmount() {
    actions.setInitialState({ apps: this.state.datasets.apps })
    super.componentWillUnmount()
    window.onbeforeunload = () => {}
    if (this.state.unblock) {
      this.state.unblock()
    }
  }

  render() {
    let dataset = this.state.datasets.dataset
    let canEdit =
      dataset &&
      (dataset.access === 'rw' || dataset.access == 'admin') &&
      !dataset.snapshot_version
    let loadingText =
      typeof this.state.datasets.loading == 'string'
        ? this.state.datasets.loading
        : 'loading'
    let content

    if (dataset) {
      let alert
      // For drafts only
      if (!('snapshot_version' in dataset)) {
        if (dataset.public) {
          alert = (
            <div className="col-xs-12">
              <div className="alert alert-success">
                <strong>This dataset has been published!</strong> Create a new
                snapshot to make changes available
              </div>
            </div>
          )
        } else {
          alert = (
            <div className="col-xs-12">
              <div className="alert alert-warning">
                <strong>This dataset has not been published!</strong> Publish
                this dataset to make all snapshots available publicly
              </div>
            </div>
          )
        }
      }
      // meta description is README unless it's empty
      content = (
        <div className="row">
          {alert}
          <div className="col-xs-6">
            <h1 className="clearfix">
              <ClickToEdit
                value={dataset.label}
                label={dataset.label}
                editable={canEdit}
                onChange={actions.updateName}
                type="string"
              />
            </h1>
            <LoginModal show={this.state.loginModal} min={true} />
            {this._uploaded(dataset)}
            {this._modified(dataset.modified)}
            {this._authors(dataset.authors)}
            <div className="clearfix status-container">
              <Metrics dataset={dataset} />
            </div>
            <Summary summary={dataset.summary} />
            <div className="clearfix status-container">
              <Statuses dataset={dataset} />
            </div>
            <MetaData
              dataset={dataset}
              editable={canEdit}
              issues={this.state.datasets.metadataIssues}
            />
            {this._commentTree()}
          </div>
          <div className="col-xs-6">
            <div>
              {this._validation(dataset)}
              <div className="fade-in col-xs-12">
                <ErrorBoundary message="The server failed to provide OpenNeuro with a list of jobs.">
                  <Jobs />
                </ErrorBoundary>
              </div>
              <div className="dataset-files">
                {this._incompleteMessage(dataset)}
                {this._fileTree.bind(this)(dataset, canEdit)}
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      if (this.state.datasets.redirectUrl) {
        content = <Redirect to={this.state.datasets.redirectUrl} />
      } else {
        let message
        let status = this.state.datasets.status
        if (status === 404) {
          message = 'Dataset not found'
        }
        if (status === 403) {
          message = 'You are not authorized to view this dataset'
        }
        content = (
          <div className="page dataset">
            <div className="dataset-container">
              <h2 className="message-4">{message}</h2>
            </div>
          </div>
        )
      }
    }

    return (
      <ErrorBoundary
        message="The dataset has failed to load in time. Please check your network connection."
        className="col-xs-12 dataset-inner dataset-route dataset-wrap inner-route light text-center">
        {this.state.datasets.loading ? (
          <Timeout timeout={100000}>
            <Spinner active={true} text={loadingText} />
          </Timeout>
        ) : (
          content
        )}
      </ErrorBoundary>
    )
  }

  // functions -------------------------------------
  _toggleModal(prop, value) {
    let state = this.state
    state[prop] = value
    this.setState(state)
  }

  // template methods ---------------------------------------------------

  _authors(authors) {
    if (authors.length > 0) {
      let authorString = 'authored by '
      for (let i = 0; i < authors.length; i++) {
        let author = authors[i]
        authorString += author
        if (authors.length > 1) {
          if (i < authors.length - 2) {
            authorString += ', '
          } else if (i == authors.length - 2) {
            authorString += ' and '
          }
        }
      }
      return <h6>{authorString}</h6>
    }
  }

  _validation(dataset) {
    if (dataset.linkID && !dataset.status.incomplete) {
      return <Validation datasetId={dataset.linkID} />
    }
    return null
  }

  _fileTree(dataset, canEdit) {
    let fileTree = (
      <FileTree
        tree={[dataset]}
        editable={canEdit}
        history={this.props.history}
        loading={this.state.datasets.loadingTree}
        dismissError={actions.dismissError}
        deleteFile={actions.deleteFile}
        getFileDownloadTicket={actions.getFileDownloadTicket}
        displayFile={actions.displayFile.bind(this, null, null)}
        editFile={actions.editFile.bind(this, null, null)}
        toggleFolder={actions.toggleFolder}
        addFile={actions.addFile}
        addDirectoryFile={actions.addDirectoryFile}
        deleteDirectory={actions.deleteDirectory}
        updateFile={actions.updateFile}
        topLevel
      />
    )
    if (this.state.datasets.uploading && !('original' in dataset)) {
      const max = this.state.datasets.uploadingFileCount
      const now = this.state.datasets.uploadingProgress
      const progress = {
        max,
        now,
        label: now + '/' + max + ' files uploaded',
      }
      fileTree = (
        <ul className="uploading-directory">
          <li className="clearfix uploading-spinner">
            <Spinner active={true} text="Adding files..." />
          </li>
          <li className="clearfix uploading-progress">
            <ProgressBar active {...progress} />
          </li>
        </ul>
      )
    }

    if (!dataset.status.incomplete || 'snapshot_version' in dataset) {
      return (
        <div className="col-xs-12">
          <div className="file-structure fade-in panel-group">
            <div className="panel panel-default">
              <div className="panel-heading">
                <h3 className="panel-title">Dataset File Tree</h3>
              </div>
              <div className="panel-collapse" aria-expanded="false">
                <div className="panel-body">{fileTree}</div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  _commentHeader() {
    let sortBar
    if (this.state.datasets.commentTree.length) {
      sortBar = (
        <span className="comment-sort">
          SORT BY:
          <select
            value={this.state.datasets.commentSortOrder}
            onChange={actions.sortComments}
            className="comment-sort-select">
            <option value="ASC">Date: Newest First</option>
            <option value="DESC">Date: Oldest First</option>
          </select>
        </span>
      )
    }
    let uploaderFollowing
    if (this.state.datasets.dataset.uploaderSubscribed) {
      uploaderFollowing = (
        <span className="uploader-following">
          <i className="fa fa-user" />
          Uploader is Following
        </span>
      )
    }
    let content = (
      <div className="comment-header">
        <label>COMMENTS</label>
        <div>
          {uploaderFollowing}
          {sortBar}
        </div>
      </div>
    )

    return content
  }
  _commentTree() {
    // add a top level comment box to the dataset if user is logged in
    let loggedIn = getProfile() !== null
    let isAdmin =
      loggedIn && this.state.datasets.currentUser
        ? this.state.datasets.currentUser.admin
        : false

    let content = []
    if (loggedIn) {
      content.push(
        <div className="comment-box top-level" key="topComment">
          <Comment
            createComment={actions.createComment}
            parentId={null}
            show={true}
            new={true}
          />
        </div>,
      )
    } else {
      content.push(
        <div key="commentLoginMessage" className="login-for-comments">
          Please{' '}
          <a
            onClick={() => {
              this.toggleModal('loginModal', true)
            }}>
            sign in
          </a>{' '}
          to contribute to the discussion.
        </div>,
      )
    }

    // construct comment tree
    for (let comment of this.state.datasets.commentTree) {
      content.push(
        <div key={comment._id}>
          <CommentTree
            uploadUser={this.state.datasets.dataset.user}
            user={this.state.datasets.currentUser.profile}
            isAdmin={isAdmin}
            node={comment}
            datasetId={this.props.match.params.datasetId}
            createComment={actions.createComment}
            deleteComment={actions.deleteComment}
            updateComment={actions.updateComment}
            isParent={true}
          />
        </div>,
      )
    }
    return (
      <div className="dataset-comments">
        {this._commentHeader()}
        <div className="comments">{content}</div>
      </div>
    )
  }

  _incompleteMessage(dataset) {
    if (
      dataset.status.incomplete &&
      this.state.datasets.currentUploadId !== dataset._id &&
      !('snapshot_version' in dataset)
    ) {
      return (
        <div className="col-xs-12 incomplete-dataset">
          <div className="incomplete-wrap fade-in panel-group">
            <div className="panel panel-default status">
              <div className="panel-heading">
                <h4 className="panel-title">
                  <span className="dataset-status ds-warning">
                    <i className="fa fa-warning" /> Incomplete
                  </span>
                  <UploadResume datasetId={dataset.linkID} />
                </h4>
              </div>
              <div className="panel-collapse" aria-expanded="false">
                <div className="panel-body">
                  You will have limited functionality on this dataset until it
                  is completed. Please click resume to finish uploading.
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  }

  // custom methods -----------------------------------------------------

  _modified(modified) {
    const dateModified = formatDate(modified)
    const timeago = distanceInWordsToNow(modified)
    return <h6>{'last modified ' + dateModified + ' - ' + timeago + ' ago'}</h6>
  }

  _uploaded(dataset) {
    let user = dataset ? dataset.user : null
    const dateCreated = dataset.created
    const dateAdded = formatDate(dateCreated)
    const timeago = distanceInWordsToNow(dateCreated)
    return (
      <h6>
        {'uploaded ' +
          (user ? 'by ' + user.name : '') +
          ' on ' +
          dateAdded +
          ' - ' +
          timeago +
          ' ago'}
      </h6>
    )
  }

  _onFileSelect() {
    // TODO - Re-enable resume here
  }
}

DatasetContent.propTypes = {
  match: PropTypes.object,
  location: PropTypes.object,
}

export default withRouter(DatasetContent)
