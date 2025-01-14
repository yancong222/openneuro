import React from 'react'
import PropTypes from 'prop-types'
import { Link, useLocation } from 'react-router-dom'
import { useCookies } from 'react-cookie'
import snapshotVersion from '../snapshotVersion.js'
import parseISO from 'date-fns/parseISO'
import format from 'date-fns/format'
import { getProfile, hasEditPermissions } from '../../authentication/profile.js'

export const SidebarRow = ({
  datasetId,
  id,
  version,
  modified,
  draft = false,
  active,
}) => {
  const url = draft
    ? `/datasets/${datasetId}`
    : `/datasets/${datasetId}/versions/${version}`
  const activeClass = draft
    ? (active === 'draft' && 'active') || ''
    : (active === version && 'active') || ''
  let dateModified
  try {
    dateModified = format(parseISO(modified), 'yyyy-MM-dd')
  } catch (err) {
    dateModified = 'N/A'
  }
  return (
    <li key={id}>
      <Link to={url} className={activeClass}>
        <div className="clearfix">
          <div className=" col-xs-12">
            <span className="dataset-type">{version}</span>
            <span className="date-modified">{dateModified}</span>
            <span className="icons" />
          </div>
        </div>
      </Link>
    </li>
  )
}

SidebarRow.propTypes = {
  datasetId: PropTypes.string,
  id: PropTypes.string,
  version: PropTypes.string,
  draft: PropTypes.bool,
  active: PropTypes.string,
  modified: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
}

const LeftSidebar = ({ dataset, datasetId, draftModified, snapshots }) => {
  const [cookies] = useCookies()
  const location = useLocation()
  const active = snapshotVersion(location) || 'draft'
  const user = getProfile(cookies)
  const hasEdit =
    (user && user.admin) ||
    hasEditPermissions(dataset.permissions, user && user.sub)
  return (
    <div className="left-sidebar">
      <span className="slide">
        <div role="presentation" className="snapshot-select">
          <span>
            <h3>Versions</h3>
            <ul>
              {hasEdit && (
                <SidebarRow
                  key={'Draft'}
                  id={datasetId}
                  datasetId={datasetId}
                  version={'Draft'}
                  modified={draftModified}
                  draft
                  active={active}
                />
              )}
              {snapshots.map(snapshot => (
                <SidebarRow
                  key={snapshot.id}
                  id={snapshot.id}
                  datasetId={datasetId}
                  version={snapshot.tag}
                  modified={snapshot.created}
                  active={active}
                />
              ))}
            </ul>
          </span>
        </div>
      </span>
    </div>
  )
}

LeftSidebar.propTypes = {
  active: PropTypes.string,
  dataset: PropTypes.object,
  datasetId: PropTypes.string,
  snapshots: PropTypes.array,
  draftModified: PropTypes.string,
}

export default LeftSidebar
